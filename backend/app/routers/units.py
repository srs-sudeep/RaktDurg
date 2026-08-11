from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.middleware.rbac import require_facility_staff, require_district_admin, require_roles, get_current_user
from app.models.enums import UserRoleEnum
from app.models.unit import BloodUnit, Component, TestResult
from app.schemas.units import (
    BarcodeLookupResponse,
    ComponentOut,
    RecordTestsRequest,
    SeparateComponentsRequest,
    TestResultOut,
    UnitCreateRequest,
    UnitOut,
    UnitTransitionRequest,
)
from app.services.units import (
    UnitStateError,
    create_unit,
    get_unit_by_barcode,
    record_test_results,
    separate_components,
    transition_unit,
)

router = APIRouter(prefix="/units", tags=["units"])


@router.post("", response_model=UnitOut, status_code=status.HTTP_201_CREATED)
async def create_blood_unit(
    body: UnitCreateRequest,
    actor=Depends(require_roles(
        UserRoleEnum.DISTRICT_ADMIN, UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR,
    )),
    db: AsyncSession = Depends(get_db),
):
    unit = await create_unit(body, actor.id, db)
    await db.commit()
    await db.refresh(unit)
    return unit


@router.get("", response_model=dict)
async def list_units(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    facility_id: uuid.UUID | None = None,
    blood_group: str | None = None,
    lifecycle_state: str | None = None,
    q: str | None = Query(None, max_length=100),
    order_by: str | None = Query(None, description="barcode|created_at|expiry_datetime|blood_group|lifecycle_state"),
    order: str | None = Query("desc", pattern="^(asc|desc)$"),
    _actor=Depends(require_facility_staff),
    db: AsyncSession = Depends(get_db),
):
    from app.core.query import apply_ilike_search, apply_order

    stmt = select(BloodUnit)
    if facility_id:
        stmt = stmt.where(BloodUnit.facility_id == facility_id)
    if blood_group:
        stmt = stmt.where(BloodUnit.blood_group == blood_group)
    if lifecycle_state:
        stmt = stmt.where(BloodUnit.lifecycle_state == lifecycle_state)
    stmt = apply_ilike_search(stmt, q, BloodUnit.barcode)

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()
    stmt = apply_order(
        stmt,
        order_by=order_by,
        order=order,
        allowlist={
            "barcode": BloodUnit.barcode,
            "created_at": BloodUnit.created_at,
            "expiry_datetime": BloodUnit.expiry_datetime,
            "blood_group": BloodUnit.blood_group,
            "lifecycle_state": BloodUnit.lifecycle_state,
        },
        default="created_at",
        default_dir="desc",
    )
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    return {
        "items": [UnitOut.model_validate(u) for u in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/scan/{barcode}", response_model=BarcodeLookupResponse)
async def scan_barcode(
    barcode: str,
    _actor=Depends(require_facility_staff),
    db: AsyncSession = Depends(get_db),
):
    unit = await get_unit_by_barcode(barcode, db)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barcode not found")

    tests_result = await db.execute(select(TestResult).where(TestResult.unit_id == unit.id))
    tests = tests_result.scalars().all()

    comps_result = await db.execute(select(Component).where(Component.unit_id == unit.id))
    comps = comps_result.scalars().all()

    return BarcodeLookupResponse(
        unit=UnitOut.model_validate(unit),
        test_results=[TestResultOut.model_validate(t) for t in tests],
        components=[ComponentOut.model_validate(c) for c in comps],
    )


@router.get("/{unit_id}", response_model=UnitOut)
async def get_unit(
    unit_id: uuid.UUID,
    _actor=Depends(require_facility_staff),
    db: AsyncSession = Depends(get_db),
):
    unit = await db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return unit


@router.post("/{unit_id}/tests", response_model=list[TestResultOut], status_code=status.HTTP_201_CREATED)
async def add_test_results(
    unit_id: uuid.UUID,
    body: RecordTestsRequest,
    actor=Depends(require_facility_staff),
    db: AsyncSession = Depends(get_db),
):
    unit = await db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    try:
        records = await record_test_results(unit, body.results, actor.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    await db.commit()
    for r in records:
        await db.refresh(r)
    return records


@router.post("/{unit_id}/components", response_model=list[ComponentOut], status_code=status.HTTP_201_CREATED)
async def separate(
    unit_id: uuid.UUID,
    body: SeparateComponentsRequest,
    actor=Depends(require_facility_staff),
    db: AsyncSession = Depends(get_db),
):
    unit = await db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    try:
        comps = await separate_components(unit, body, actor.id, db)
    except UnitStateError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    for c in comps:
        await db.refresh(c)
    return comps


@router.patch("/{unit_id}/state", response_model=UnitOut)
async def change_state(
    unit_id: uuid.UUID,
    body: UnitTransitionRequest,
    actor=Depends(require_roles(
        UserRoleEnum.DISTRICT_ADMIN, UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR,
    )),
    db: AsyncSession = Depends(get_db),
):
    unit = await db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    try:
        unit = await transition_unit(unit, body.target_state, body.reason, db)
    except UnitStateError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(unit)
    return unit
