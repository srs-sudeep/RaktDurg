from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.donor import Donor, Screening
from app.models.enums import UserRoleEnum
from app.schemas.donors import (
    DonorCreateRequest,
    DonorListResponse,
    DonorOut,
    DonorUpdateRequest,
    ScreeningCreateRequest,
    ScreeningOut,
)
from app.services.donors import register_donor, screen_donor

router = APIRouter(prefix="/donors", tags=["donors"])

_CLINICAL_ROLES = (
    UserRoleEnum.ADMIN,
    UserRoleEnum.MEDICAL_OFFICER,
    UserRoleEnum.PHLEBOTOMIST,
    UserRoleEnum.LAB_TECH,
)


@router.post("", response_model=DonorOut, status_code=status.HTTP_201_CREATED)
async def create_donor(
    body: DonorCreateRequest,
    actor=Depends(require_roles(*_CLINICAL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    donor = await register_donor(body, actor.facility_id, actor.id, db)
    await db.commit()
    await db.refresh(donor)
    return donor


@router.get("", response_model=DonorListResponse)
async def list_donors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    blood_group: str | None = None,
    _actor=Depends(require_roles(*_CLINICAL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Donor)
    if blood_group:
        stmt = stmt.where(Donor.blood_group == blood_group)

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    return DonorListResponse(
        items=[DonorOut.model_validate(d) for d in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{donor_id}", response_model=DonorOut)
async def get_donor(
    donor_id: uuid.UUID,
    _actor=Depends(require_roles(*_CLINICAL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    donor = await db.get(Donor, donor_id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return donor


@router.patch("/{donor_id}", response_model=DonorOut)
async def update_donor(
    donor_id: uuid.UUID,
    body: DonorUpdateRequest,
    _actor=Depends(require_roles(UserRoleEnum.ADMIN, UserRoleEnum.MEDICAL_OFFICER, UserRoleEnum.PHLEBOTOMIST)),
    db: AsyncSession = Depends(get_db),
):
    donor = await db.get(Donor, donor_id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(donor, field, value)

    await db.commit()
    await db.refresh(donor)
    return donor


@router.post("/{donor_id}/screenings", response_model=ScreeningOut, status_code=status.HTTP_201_CREATED)
async def create_screening(
    donor_id: uuid.UUID,
    body: ScreeningCreateRequest,
    actor=Depends(require_roles(*_CLINICAL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    if body.donor_id != donor_id:
        raise HTTPException(status_code=422, detail="donor_id in body must match URL")

    try:
        screening, _decision = await screen_donor(body, actor.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(screening)
    return screening


@router.get("/{donor_id}/screenings", response_model=list[ScreeningOut])
async def list_screenings(
    donor_id: uuid.UUID,
    _actor=Depends(require_roles(*_CLINICAL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Screening)
        .where(Screening.donor_id == donor_id)
        .order_by(Screening.screening_datetime.desc())
    )
    return result.scalars().all()
