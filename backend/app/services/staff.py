from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auth import User
from app.models.camp import Camp, CampBooking
from app.models.donor import Donor
from app.models.enums import UserRoleEnum
from app.schemas.staff import (
    BookingReviewRequest,
    CitizenLinkOut,
    StaffCampBookingOut,
)


class StaffActionError(Exception):
    pass


async def link_citizen_account(
    username: str,
    donor_id: uuid.UUID,
    actor: User,
    db: AsyncSession,
) -> CitizenLinkOut:
    if actor.role not in (UserRoleEnum.SUPERADMIN, UserRoleEnum.DISTRICT_ADMIN):
        raise StaffActionError("Only district admin or superadmin can link citizen accounts")

    user_result = await db.execute(select(User).where(User.username == username))
    citizen_user = user_result.scalar_one_or_none()
    if citizen_user is None:
        raise StaffActionError("Citizen user not found")
    if citizen_user.role != UserRoleEnum.CITIZEN:
        raise StaffActionError("Target user must have the citizen role")

    existing_for_user = await db.execute(select(Donor).where(Donor.user_id == citizen_user.id))
    if existing_for_user.scalar_one_or_none():
        raise StaffActionError("This citizen account is already linked to a donor profile")

    donor = await db.get(Donor, donor_id)
    if donor is None:
        raise StaffActionError("Donor not found")
    if donor.user_id is not None:
        raise StaffActionError("This donor profile is already linked to another account")

    donor.user_id = citizen_user.id
    await db.flush()
    return CitizenLinkOut(
        user_id=citizen_user.id,
        username=citizen_user.username,
        donor_id=donor.id,
        donor_name=donor.name,
    )


async def list_staff_camp_bookings(
    db: AsyncSession,
    status: str | None = None,
) -> list[StaffCampBookingOut]:
    stmt = (
        select(CampBooking)
        .options(selectinload(CampBooking.camp), selectinload(CampBooking.donor))
        .order_by(CampBooking.created_at.desc())
    )
    if status:
        stmt = stmt.where(CampBooking.status == status)

    result = await db.execute(stmt)
    bookings = result.scalars().all()
    return [
        StaffCampBookingOut(
            id=booking.id,
            camp_id=booking.camp_id,
            camp_name=booking.camp.camp_name or "Upcoming blood donation camp",
            requested_date=booking.camp.requested_date,
            location=booking.camp.location,
            donor_id=booking.donor_id,
            donor_name=booking.donor.name,
            donor_phone=booking.donor.contact_phone,
            blood_group=booking.donor.blood_group.value if booking.donor.blood_group else None,
            status=booking.status,
            notes=booking.notes,
            review_notes=booking.review_notes,
            reviewed_at=booking.reviewed_at,
            created_at=booking.created_at,
        )
        for booking in bookings
    ]


async def review_camp_booking(
    booking_id: uuid.UUID,
    body: BookingReviewRequest,
    actor: User,
    db: AsyncSession,
) -> StaffCampBookingOut:
    if actor.role not in (UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.DISTRICT_ADMIN):
        raise StaffActionError("Only clinical staff can review camp bookings")

    result = await db.execute(
        select(CampBooking)
        .options(selectinload(CampBooking.camp), selectinload(CampBooking.donor))
        .where(CampBooking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise StaffActionError("Booking not found")
    if booking.status not in ("requested",):
        raise StaffActionError("Only requested bookings can be reviewed")

    booking.status = "confirmed" if body.action == "confirm" else "rejected"
    booking.reviewed_by = actor.id
    booking.reviewed_at = datetime.now(tz=timezone.utc)
    booking.review_notes = body.review_notes
    await db.flush()

    return StaffCampBookingOut(
        id=booking.id,
        camp_id=booking.camp_id,
        camp_name=booking.camp.camp_name or "Upcoming blood donation camp",
        requested_date=booking.camp.requested_date,
        location=booking.camp.location,
        donor_id=booking.donor_id,
        donor_name=booking.donor.name,
        donor_phone=booking.donor.contact_phone,
        blood_group=booking.donor.blood_group.value if booking.donor.blood_group else None,
        status=booking.status,
        notes=booking.notes,
        review_notes=booking.review_notes,
        reviewed_at=booking.reviewed_at,
        created_at=booking.created_at,
    )
