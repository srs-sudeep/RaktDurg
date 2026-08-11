"""
Camp management service.

Key invariant: only one camp per (host_facility, requested_date) may be in
submitted / under_review / approved state simultaneously.
The calendar-blocking partial unique index enforces this at DB level;
we catch IntegrityError and surface a 409 in the router.

On approval, CampCoupons are generated: {coupon_prefix}-{seq:04d}.
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.camp import Camp, CampCoupon
from app.models.donor import Organizer
from app.models.enums import CampStatusEnum
from app.schemas.camps import CampApplyRequest, CampReviewRequest


class CampCalendarConflict(Exception):
    pass


async def apply_for_camp(
    request: CampApplyRequest,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> Camp:
    organizer_result = await db.execute(
        select(Organizer).where(Organizer.user_id == actor_id)
    )
    organizer = organizer_result.scalar_one_or_none()
    if not organizer:
        raise ValueError("You must be a registered organizer to apply for a camp")

    camp = Camp(
        organizer_id=organizer.id,
        host_facility_id=request.host_facility_id,
        camp_name=request.camp_name,
        requested_date=request.requested_date,
        location=request.location,
        expected_donors=request.expected_donors,
        status=CampStatusEnum.SUBMITTED,
    )
    db.add(camp)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise CampCalendarConflict(
            f"A camp is already scheduled at this facility on {request.requested_date}"
        )
    return camp


async def review_camp(
    camp: Camp,
    request: CampReviewRequest,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> Camp:
    if camp.status not in (CampStatusEnum.SUBMITTED, CampStatusEnum.UNDER_REVIEW):
        raise ValueError(f"Camp in state '{camp.status.value}' cannot be reviewed")

    if request.action == "approve":
        if not request.coupon_prefix:
            raise ValueError("coupon_prefix is required when approving a camp")
        camp.status = CampStatusEnum.APPROVED
        camp.coupon_prefix = request.coupon_prefix
        camp.approved_by = actor_id
        from datetime import datetime, timezone
        camp.approval_datetime = datetime.now(tz=timezone.utc)
        await db.flush()
        await _generate_coupons(camp, db)
    else:
        if not request.rejection_reason:
            raise ValueError("rejection_reason is required when rejecting a camp")
        camp.status = CampStatusEnum.REJECTED
        camp.rejection_reason = request.rejection_reason

    return camp


async def _generate_coupons(camp: Camp, db: AsyncSession) -> None:
    for i in range(1, camp.expected_donors + 1):
        coupon = CampCoupon(
            camp_id=camp.id,
            coupon_code=f"{camp.coupon_prefix}-{i:04d}",
            is_used=False,
        )
        db.add(coupon)
    await db.flush()


async def cancel_camp(camp: Camp, db: AsyncSession) -> Camp:
    if camp.status in (CampStatusEnum.COMPLETED, CampStatusEnum.CANCELLED):
        raise ValueError(f"Camp is already {camp.status.value}")
    camp.status = CampStatusEnum.CANCELLED
    return camp
