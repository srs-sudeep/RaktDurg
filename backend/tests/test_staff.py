from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.models.camp import Camp, CampBooking
from app.models.donor import Donor, Organizer
from app.models.enums import (
    BloodGroupEnum,
    CampStatusEnum,
    DonorStatusEnum,
    SexEnum,
    UserRoleEnum,
)
from app.models.facility import Facility
from app.services.auth import hash_password


@pytest.mark.asyncio
async def test_staff_can_link_citizen_to_donor(
    client: AsyncClient,
    db: AsyncSession,
    seed_users,
    facility,
):
    from tests.conftest import auth_header

    admin = seed_users[UserRoleEnum.DISTRICT_ADMIN]
    unlinked_donor = Donor(
        name="Unlinked Donor",
        date_of_birth=date(1990, 1, 1),
        sex=SexEnum.MALE,
        contact_phone="9999900001",
        blood_group=BloodGroupEnum.O_POS,
        status=DonorStatusEnum.ACTIVE,
        consent_given=True,
        registered_at_facility_id=facility.id,
        created_by=admin.id,
    )
    db.add(unlinked_donor)
    unlinked_citizen = User(
        username="link_test_citizen",
        hashed_password=hash_password("testpass123"),
        role=UserRoleEnum.CITIZEN,
        display_name="Link Test Citizen",
        is_active=True,
    )
    db.add(unlinked_citizen)
    await db.flush()

    resp = await client.post(
        "/admin/citizens/link",
        json={"username": "link_test_citizen", "donor_id": str(unlinked_donor.id)},
        headers=auth_header(admin),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "link_test_citizen"
    assert data["donor_id"] == str(unlinked_donor.id)

    await db.refresh(unlinked_donor)
    assert unlinked_donor.user_id == unlinked_citizen.id


@pytest.mark.asyncio
async def test_staff_can_review_camp_booking(
    client: AsyncClient,
    db: AsyncSession,
    seed_users,
    facility: Facility,
):
    from tests.conftest import auth_header

    organizer_user = seed_users[UserRoleEnum.ORGANIZER]
    organizer = Organizer(user_id=organizer_user.id, org_name="Review Test Org")
    db.add(organizer)
    await db.flush()
    camp = Camp(
        organizer_id=organizer.id,
        host_facility_id=facility.id,
        camp_name="Review Camp",
        requested_date=date.today() + timedelta(days=14),
        location="Durg",
        expected_donors=50,
        status=CampStatusEnum.APPROVED,
        approved_by=seed_users[UserRoleEnum.DOCTOR].id,
        approval_datetime=datetime.now(timezone.utc),
    )
    db.add(camp)
    citizen = seed_users[UserRoleEnum.CITIZEN]
    donor_result = await db.execute(select(Donor).where(Donor.user_id == citizen.id))
    citizen_donor = donor_result.scalar_one()
    await db.flush()

    booking = CampBooking(
        camp_id=camp.id,
        donor_id=citizen_donor.id,
        status="requested",
        notes="Need morning slot",
    )
    db.add(booking)
    await db.flush()

    doctor = seed_users[UserRoleEnum.DOCTOR]
    resp = await client.post(
        f"/camps/bookings/{booking.id}/review",
        json={"action": "confirm", "review_notes": "See you at 9am"},
        headers=auth_header(doctor),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "confirmed"
    assert data["review_notes"] == "See you at 9am"

    list_resp = await client.get(
        "/camps/bookings/list",
        params={"status": "confirmed"},
        headers=auth_header(doctor),
    )
    assert list_resp.status_code == 200
    assert any(item["id"] == str(booking.id) for item in list_resp.json())


@pytest.mark.asyncio
async def test_district_admin_can_list_requested_bookings(
    client: AsyncClient,
    db: AsyncSession,
    seed_users,
    facility: Facility,
):
    from tests.conftest import auth_header

    organizer_user = seed_users[UserRoleEnum.ORGANIZER]
    organizer = Organizer(user_id=organizer_user.id, org_name="List Test Org")
    db.add(organizer)
    await db.flush()
    camp = Camp(
        organizer_id=organizer.id,
        host_facility_id=facility.id,
        camp_name="List Camp",
        requested_date=date.today() + timedelta(days=21),
        location="Durg",
        expected_donors=40,
        status=CampStatusEnum.APPROVED,
        approved_by=seed_users[UserRoleEnum.DOCTOR].id,
        approval_datetime=datetime.now(timezone.utc),
    )
    db.add(camp)
    citizen = seed_users[UserRoleEnum.CITIZEN]
    donor_result = await db.execute(select(Donor).where(Donor.user_id == citizen.id))
    citizen_donor = donor_result.scalar_one()
    await db.flush()

    db.add(
        CampBooking(
            camp_id=camp.id,
            donor_id=citizen_donor.id,
            status="requested",
        )
    )
    await db.flush()

    admin = seed_users[UserRoleEnum.DISTRICT_ADMIN]
    resp = await client.get(
        "/camps/bookings/list",
        params={"status": "requested"},
        headers=auth_header(admin),
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
