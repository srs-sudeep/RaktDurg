from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auth import User
from app.models.camp import Camp, CampBooking
from app.models.donor import Donation, Donor
from app.models.enums import CampStatusEnum
from app.models.facility import Facility
from app.models.wallet import WalletTransaction
from app.schemas.citizen import (
    CampBookingCreateRequest,
    CampBookingOut,
    CitizenProfileOut,
    CitizenStockOut,
    DonationHistoryItem,
    PublicCampOut,
    PublicFacilityOut,
)
from app.schemas.units import StockEntry
from app.services.stock import get_facility_stock
from app.services.wallet import get_or_create_wallet

DEFAULT_FACILITY_CODE = "RKDURG"


class CitizenAccessError(Exception):
    pass


async def get_linked_donor(current_user: User, db: AsyncSession) -> Donor:
    result = await db.execute(
        select(Donor).where(Donor.user_id == current_user.id)
    )
    donor = result.scalar_one_or_none()
    if donor is None:
        raise CitizenAccessError("Citizen account is not linked to a donor profile yet")
    return donor


async def resolve_default_facility(db: AsyncSession) -> Facility:
    result = await db.execute(
        select(Facility).where(Facility.facility_code == DEFAULT_FACILITY_CODE, Facility.is_active.is_(True))
    )
    facility = result.scalar_one_or_none()
    if facility is None:
        result = await db.execute(select(Facility).where(Facility.is_active.is_(True)).limit(1))
        facility = result.scalar_one_or_none()
    if facility is None:
        raise CitizenAccessError("No active blood bank facility configured")
    return facility


async def resolve_citizen_facility(donor: Donor, db: AsyncSession) -> Facility:
    if donor.registered_at_facility_id:
        facility = await db.get(Facility, donor.registered_at_facility_id)
        if facility and facility.is_active:
            return facility
    return await resolve_default_facility(db)


async def get_public_default_facility(db: AsyncSession) -> PublicFacilityOut:
    facility = await resolve_default_facility(db)
    return PublicFacilityOut(
        id=facility.id,
        name=facility.name,
        facility_code=facility.facility_code,
        district=facility.district,
    )


async def get_citizen_stock(current_user: User, db: AsyncSession) -> CitizenStockOut:
    donor = await get_linked_donor(current_user, db)
    facility = await resolve_citizen_facility(donor, db)
    rows = await get_facility_stock(db, facility.id)
    return CitizenStockOut(
        facility_id=facility.id,
        facility_name=facility.name,
        entries=[
            StockEntry(
                blood_group=r["blood_group"],
                component_type=r["component_type"],
                available_count=r["available_count"],
                earliest_expiry=None,
            )
            for r in rows
        ],
        as_of=datetime.now(tz=timezone.utc),
    )


async def get_citizen_profile(current_user: User, db: AsyncSession) -> CitizenProfileOut:
    donor = await get_linked_donor(current_user, db)
    facility_name = None
    if donor.registered_at_facility_id:
        facility = await db.get(Facility, donor.registered_at_facility_id)
        facility_name = facility.name if facility else None
    return CitizenProfileOut(
        donor_id=donor.id,
        user_id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        name=donor.name,
        date_of_birth=donor.date_of_birth,
        age_years=donor.age_years,
        sex=donor.sex,
        contact_phone=donor.contact_phone,
        address=donor.address,
        blood_group=donor.blood_group,
        status=donor.status,
        abha_reference=donor.abha_reference,
        abha_verified=donor.abha_verified,
        consent_given=donor.consent_given,
        registered_at_facility_id=donor.registered_at_facility_id,
        registered_at_facility_name=facility_name,
    )


async def list_citizen_donations(current_user: User, db: AsyncSession) -> list[DonationHistoryItem]:
    donor = await get_linked_donor(current_user, db)
    result = await db.execute(
        select(Donation, Camp)
        .outerjoin(Camp, Donation.camp_id == Camp.id)
        .where(Donation.donor_id == donor.id)
        .order_by(Donation.collection_datetime.desc())
    )
    items: list[DonationHistoryItem] = []
    for donation, camp in result.all():
        items.append(
            DonationHistoryItem(
                donation_id=donation.id,
                camp_id=donation.camp_id,
                camp_name=camp.camp_name if camp else None,
                location=camp.location if camp else None,
                collection_datetime=donation.collection_datetime,
                donation_type=donation.donation_type,
                volume_ml=donation.volume_ml,
            )
        )
    return items


async def list_public_camps(db: AsyncSession) -> list[PublicCampOut]:
    today = date.today()
    result = await db.execute(
        select(Camp, Facility)
        .join(Facility, Camp.host_facility_id == Facility.id)
        .where(Camp.status == CampStatusEnum.APPROVED, Camp.requested_date >= today)
        .order_by(Camp.requested_date.asc())
    )
    return [
        PublicCampOut(
            id=camp.id,
            camp_name=camp.camp_name or "Upcoming blood donation camp",
            requested_date=camp.requested_date,
            location=camp.location,
            expected_donors=camp.expected_donors,
            host_facility_id=camp.host_facility_id,
            host_facility_name=facility.name,
        )
        for camp, facility in result.all()
    ]


async def get_citizen_wallet(current_user: User, db: AsyncSession):
    donor = await get_linked_donor(current_user, db)
    wallet = await get_or_create_wallet(donor.id, db)
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.recorded_at.desc())
    )
    return wallet, result.scalars().all()


async def create_camp_booking(
    current_user: User, body: CampBookingCreateRequest, db: AsyncSession
) -> CampBookingOut:
    donor = await get_linked_donor(current_user, db)
    camp = await db.get(Camp, body.camp_id)
    if camp is None or camp.status != CampStatusEnum.APPROVED:
        raise ValueError("Camp not found or not open for public booking")
    if camp.requested_date < date.today():
        raise ValueError("Cannot book a past camp")

    existing = await db.execute(
        select(CampBooking).where(CampBooking.camp_id == body.camp_id, CampBooking.donor_id == donor.id)
    )
    booking = existing.scalar_one_or_none()
    if booking:
        if booking.status == "cancelled":
            booking.status = "requested"
            booking.notes = body.notes
        else:
            raise ValueError("You already have a booking for this camp")
    else:
        booking = CampBooking(camp_id=body.camp_id, donor_id=donor.id, notes=body.notes, status="requested")
        db.add(booking)

    await db.flush()
    await db.refresh(booking)
    return CampBookingOut(
        id=booking.id,
        camp_id=camp.id,
        camp_name=camp.camp_name or "Upcoming blood donation camp",
        requested_date=camp.requested_date,
        location=camp.location,
        status=booking.status,
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


async def list_citizen_bookings(current_user: User, db: AsyncSession) -> list[CampBookingOut]:
    donor = await get_linked_donor(current_user, db)
    result = await db.execute(
        select(CampBooking)
        .options(selectinload(CampBooking.camp))
        .where(CampBooking.donor_id == donor.id)
        .order_by(CampBooking.created_at.desc())
    )
    bookings = result.scalars().all()
    return [
        CampBookingOut(
            id=booking.id,
            camp_id=booking.camp_id,
            camp_name=booking.camp.camp_name or "Upcoming blood donation camp",
            requested_date=booking.camp.requested_date,
            location=booking.camp.location,
            status=booking.status,
            notes=booking.notes,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
        )
        for booking in bookings
    ]


async def cancel_citizen_booking(
    booking_id: uuid.UUID, current_user: User, db: AsyncSession
) -> CampBookingOut:
    donor = await get_linked_donor(current_user, db)
    result = await db.execute(
        select(CampBooking)
        .options(selectinload(CampBooking.camp))
        .where(CampBooking.id == booking_id, CampBooking.donor_id == donor.id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise ValueError("Booking not found")
    booking.status = "cancelled"
    await db.flush()
    await db.refresh(booking)
    return CampBookingOut(
        id=booking.id,
        camp_id=booking.camp_id,
        camp_name=booking.camp.camp_name or "Upcoming blood donation camp",
        requested_date=booking.camp.requested_date,
        location=booking.camp.location,
        status=booking.status,
        notes=booking.notes,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )
