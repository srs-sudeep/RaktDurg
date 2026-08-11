from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.camp import Camp, CampCoupon
from app.models.enums import CampStatusEnum, UserRoleEnum
from app.schemas.camps import (
    CampApplyRequest,
    CampListResponse,
    CampOut,
    CampReviewRequest,
    CouponOut,
)
from app.services.camps import CampCalendarConflict, apply_for_camp, cancel_camp, review_camp

router = APIRouter(prefix="/camps", tags=["camps"])


@router.post("", response_model=CampOut, status_code=status.HTTP_201_CREATED)
async def apply(
    body: CampApplyRequest,
    actor=Depends(require_roles(UserRoleEnum.ORGANIZER, UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        camp = await apply_for_camp(body, actor.id, db)
    except CampCalendarConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(camp)
    return camp


@router.get("", response_model=CampListResponse)
async def list_camps(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    camp_status: CampStatusEnum | None = None,
    _actor=Depends(require_roles(
        UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR,
        UserRoleEnum.ORGANIZER, UserRoleEnum.DISTRICT_ADMIN,
    )),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Camp)
    if camp_status:
        stmt = stmt.where(Camp.status == camp_status)

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = stmt.order_by(Camp.requested_date.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    return CampListResponse(
        items=[CampOut.model_validate(c) for c in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{camp_id}", response_model=CampOut)
async def get_camp(
    camp_id: uuid.UUID,
    _actor=Depends(require_roles(
        UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR,
        UserRoleEnum.ORGANIZER, UserRoleEnum.DISTRICT_ADMIN,
    )),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    return camp


@router.post("/{camp_id}/review", response_model=CampOut)
async def review(
    camp_id: uuid.UUID,
    body: CampReviewRequest,
    actor=Depends(require_roles(UserRoleEnum.DOCTOR, UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    try:
        camp = await review_camp(camp, body, actor.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(camp)
    return camp


@router.post("/{camp_id}/cancel", response_model=CampOut)
async def cancel(
    camp_id: uuid.UUID,
    actor=Depends(require_roles(UserRoleEnum.ORGANIZER, UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    try:
        camp = await cancel_camp(camp, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    await db.refresh(camp)
    return camp


@router.get("/{camp_id}/coupons", response_model=list[CouponOut])
async def list_coupons(
    camp_id: uuid.UUID,
    _actor=Depends(require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.ORGANIZER)),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    result = await db.execute(select(CampCoupon).where(CampCoupon.camp_id == camp_id))
    return result.scalars().all()
