from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.models.camp import Camp
from app.models.donor import Donation, Donor, Organizer, Screening
from app.models.enums import CampStatusEnum, EligibilityResultEnum, UserRoleEnum
from app.models.facility import Facility


@pytest_asyncio.fixture
async def citizen_donor(db: AsyncSession, seed_users) -> Donor:
    citizen = seed_users[UserRoleEnum.CITIZEN]
    result = await db.execute(select(Donor).where(Donor.user_id == citizen.id))
    return result.scalar_one()


@pytest_asyncio.fixture
async def approved_camp(db: AsyncSession, facility: Facility, seed_users) -> Camp:
    organizer_user = seed_users[UserRoleEnum.ORGANIZER]
    organizer = Organizer(user_id=organizer_user.id, org_name="Citizen Camp Org")
    db.add(organizer)
    await db.flush()
    camp = Camp(
        organizer_id=organizer.id,
        host_facility_id=facility.id,
        camp_name="Public Donation Camp",
        requested_date=date.today() + timedelta(days=10),
        location="Town Hall, Durg",
        expected_donors=75,
        status=CampStatusEnum.APPROVED,
        approved_by=seed_users[UserRoleEnum.DOCTOR].id,
        approval_datetime=datetime.now(timezone.utc),
    )
    db.add(camp)
    await db.flush()
    return camp


@pytest_asyncio.fixture
async def citizen_donation(
    db: AsyncSession,
    facility: Facility,
    seed_users: dict[UserRoleEnum, User],
    citizen_donor: Donor,
    approved_camp: Camp,
) -> Donation:
    screening = Screening(
        donor_id=citizen_donor.id,
        camp_id=approved_camp.id,
        screened_by=seed_users[UserRoleEnum.DOCTOR].id,
        screening_datetime=datetime.now(timezone.utc) - timedelta(days=5),
        weight_kg=65,
        bp_systolic=120,
        bp_diastolic=80,
        pulse_bpm=72,
        temperature_celsius=36.8,
        hemoglobin_g_dl=14.1,
        questionnaire={},
        eligibility_result=EligibilityResultEnum.ELIGIBLE,
    )
    db.add(screening)
    await db.flush()
    donation = Donation(
        donor_id=citizen_donor.id,
        screening_id=screening.id,
        camp_id=approved_camp.id,
        facility_id=facility.id,
        collected_by=seed_users[UserRoleEnum.DOCTOR].id,
        collection_datetime=datetime.now(timezone.utc) - timedelta(days=5),
        donation_type="voluntary",
        volume_ml=450,
    )
    db.add(donation)
    await db.flush()
    return donation


@pytest.mark.asyncio
async def test_auth_me_includes_citizen_donor_id(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    resp = await client.get("/auth/me", headers=auth_header(citizen))
    assert resp.status_code == 200
    assert resp.json()["donor_id"] is not None


@pytest.mark.asyncio
async def test_citizen_profile_returns_linked_donor(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    resp = await client.get("/citizen/profile", headers=auth_header(citizen))
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == citizen.username
    assert data["name"] == "Citizen Test User"


@pytest.mark.asyncio
async def test_citizen_donations_returns_history(
    client: AsyncClient,
    seed_users,
    citizen_donation,
):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    resp = await client.get("/citizen/donations", headers=auth_header(citizen))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["donation_type"] == "voluntary"


@pytest.mark.asyncio
async def test_public_camps_lists_approved_upcoming(client: AsyncClient, approved_camp: Camp):
    resp = await client.get("/public/camps")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == str(approved_camp.id)


@pytest.mark.asyncio
async def test_citizen_can_create_list_and_cancel_booking(
    client: AsyncClient,
    seed_users,
    approved_camp: Camp,
):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    headers = auth_header(citizen)

    create_resp = await client.post(
        "/citizen/bookings",
        json={"camp_id": str(approved_camp.id), "notes": "Will arrive by 10am"},
        headers=headers,
    )
    assert create_resp.status_code == 201
    booking_id = create_resp.json()["id"]

    list_resp = await client.get("/citizen/bookings", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    cancel_resp = await client.post(f"/citizen/bookings/{booking_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_citizen_wallet_disabled_returns_503(client: AsyncClient, seed_users, wallet_flag_off):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    resp = await client.get("/citizen/wallet", headers=auth_header(citizen))
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_citizen_stock_uses_linked_facility(client: AsyncClient, seed_users, facility: Facility):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    resp = await client.get("/citizen/stock", headers=auth_header(citizen))
    assert resp.status_code == 200
    data = resp.json()
    assert data["facility_id"] == str(facility.id)
    assert data["facility_name"] is not None
    assert "entries" in data


@pytest.mark.asyncio
async def test_public_default_facility(client: AsyncClient, facility: Facility):
    resp = await client.get("/public/facilities/default")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == str(facility.id)
    assert data["facility_code"] == "TSTFAC"


@pytest.mark.asyncio
async def test_citizen_cannot_use_staff_wallet_donor_url(
    client: AsyncClient,
    seed_users,
    citizen_donor: Donor,
):
    from tests.conftest import auth_header

    citizen = seed_users[UserRoleEnum.CITIZEN]
    resp = await client.get(f"/wallet/donors/{citizen_donor.id}", headers=auth_header(citizen))
    assert resp.status_code == 403
