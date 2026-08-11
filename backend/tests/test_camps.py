"""
Phase 3 tests: camp application, approval, calendar blocking.
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from httpx import AsyncClient


_FUTURE_DATE = (date.today() + timedelta(days=30)).isoformat()


@pytest.mark.asyncio
async def test_apply_camp_requires_organizer_role(client: AsyncClient, seed_users, facility):
    from tests.conftest import auth_header

    lab = next(u for u in seed_users.values() if u.role.value == "district_admin")
    payload = {
        "host_facility_id": str(facility.id),
        "camp_name": "Test Camp",
        "requested_date": _FUTURE_DATE,
        "location": "Town Hall, Durg",
        "expected_donors": 50,
    }
    resp = await client.post("/camps", json=payload, headers=auth_header(lab))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_camps_superadmin(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    superadmin = next(u for u in seed_users.values() if u.role.value == "superadmin")
    resp = await client.get("/camps", headers=auth_header(superadmin))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_get_nonexistent_camp(client: AsyncClient, seed_users):
    import uuid
    from tests.conftest import auth_header

    superadmin = next(u for u in seed_users.values() if u.role.value == "superadmin")
    resp = await client.get(f"/camps/{uuid.uuid4()}", headers=auth_header(superadmin))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_review_requires_doctor(client: AsyncClient, seed_users):
    import uuid
    from tests.conftest import auth_header

    organizer = next(u for u in seed_users.values() if u.role.value == "organizer")
    body = {"action": "approve", "coupon_prefix": "TST"}
    resp = await client.post(
        f"/camps/{uuid.uuid4()}/review",
        json=body,
        headers=auth_header(organizer),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_apply_requires_alternate_dates_over_350(client: AsyncClient, seed_users, facility, db):
    from sqlalchemy import select

    from app.models.donor import Organizer
    from tests.conftest import auth_header

    organizer_user = next(u for u in seed_users.values() if u.role.value == "organizer")
    existing = await db.execute(select(Organizer).where(Organizer.user_id == organizer_user.id))
    if existing.scalar_one_or_none() is None:
        db.add(Organizer(user_id=organizer_user.id, org_name="Capacity Test Org"))
        await db.commit()

    payload = {
        "host_facility_id": str(facility.id),
        "camp_name": "Large Capacity Camp",
        "requested_date": _FUTURE_DATE,
        "venue_mode": "district_blood_bank",
        "expected_donors": 400,
    }
    resp = await client.post("/camps", json=payload, headers=auth_header(organizer_user))
    assert resp.status_code == 422

    payload["alternate_dates"] = [(date.today() + timedelta(days=35)).isoformat()]
    resp_ok = await client.post("/camps", json=payload, headers=auth_header(organizer_user))
    assert resp_ok.status_code == 201
    body = resp_ok.json()
    assert body["venue_mode"] == "district_blood_bank"
    assert body["location"] == "District Hospital Blood Bank, Durg"
    assert body["expected_donors"] == 400
