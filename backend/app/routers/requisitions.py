from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.enums import UserRoleEnum
from app.models.requisition import Issue, Requisition
from app.schemas.requisitions import (
    IssueOut,
    RequisitionCreateRequest,
    RequisitionListResponse,
    RequisitionOut,
    TransfusionRequest,
)
from app.services.requisitions import (
    InsufficientStockError,
    RequisitionStateError,
    cancel_requisition,
    create_requisition,
    issue_components,
    record_transfusion,
    reserve_components,
)

router = APIRouter(prefix="/requisitions", tags=["requisitions"])

_CLINICAL = (UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.DISTRICT_ADMIN)


@router.post("", response_model=RequisitionOut, status_code=status.HTTP_201_CREATED)
async def create(
    body: RequisitionCreateRequest,
    actor=Depends(require_roles(*_CLINICAL)),
    db: AsyncSession = Depends(get_db),
):
    req = await create_requisition(body, actor.id, db)
    await db.commit()
    await db.refresh(req)
    return req


@router.get("", response_model=RequisitionListResponse)
async def list_requisitions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    facility_id: uuid.UUID | None = None,
    status: str | None = None,
    blood_group: str | None = None,
    priority: str | None = None,
    q: str | None = Query(None, max_length=100),
    order_by: str | None = Query(None, description="requested_at|status|priority|patient_name|blood_group"),
    order: str | None = Query("desc", pattern="^(asc|desc)$"),
    _actor=Depends(require_roles(*_CLINICAL)),
    db: AsyncSession = Depends(get_db),
):
    from app.core.query import apply_ilike_search, apply_order

    stmt = select(Requisition)
    if facility_id:
        stmt = stmt.where(Requisition.facility_id == facility_id)
    if status:
        stmt = stmt.where(Requisition.status == status)
    if blood_group:
        stmt = stmt.where(Requisition.blood_group == blood_group)
    if priority:
        stmt = stmt.where(Requisition.priority == priority)
    stmt = apply_ilike_search(stmt, q, Requisition.patient_name, Requisition.patient_hospital_id)

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = apply_order(
        stmt,
        order_by=order_by,
        order=order,
        allowlist={
            "requested_at": Requisition.requested_at,
            "status": Requisition.status,
            "priority": Requisition.priority,
            "patient_name": Requisition.patient_name,
            "blood_group": Requisition.blood_group,
        },
        default="requested_at",
        default_dir="desc",
    )
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    return RequisitionListResponse(
        items=[RequisitionOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{req_id}", response_model=RequisitionOut)
async def get_requisition(
    req_id: uuid.UUID,
    _actor=Depends(require_roles(*_CLINICAL)),
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(Requisition, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return req


@router.post("/{req_id}/reserve", response_model=RequisitionOut)
async def reserve(
    req_id: uuid.UUID,
    actor=Depends(require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.DISTRICT_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(Requisition, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    try:
        await reserve_components(req, actor.id, db)
    except InsufficientStockError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except RequisitionStateError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/issue", response_model=list[IssueOut], status_code=status.HTTP_201_CREATED)
async def issue(
    req_id: uuid.UUID,
    actor=Depends(require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.DISTRICT_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(Requisition, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    try:
        issues = await issue_components(req, actor.id, db)
    except RequisitionStateError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    for i in issues:
        await db.refresh(i)
    return issues


@router.post("/{req_id}/cancel", response_model=RequisitionOut)
async def cancel(
    req_id: uuid.UUID,
    actor=Depends(require_roles(*_CLINICAL)),
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(Requisition, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    try:
        req = await cancel_requisition(req, actor.id, db)
    except RequisitionStateError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/issues/{issue_id}/transfusion", response_model=IssueOut)
async def transfusion(
    issue_id: uuid.UUID,
    body: TransfusionRequest,
    _actor=Depends(require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    issue = await db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    issue = await record_transfusion(issue, body, db)
    await db.commit()
    await db.refresh(issue)
    return issue
