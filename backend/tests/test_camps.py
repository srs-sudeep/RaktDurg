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

    lab = next(u for u in seed_users.values() if u.role.value == "lab_tech")
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
async def test_list_camps_admin(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    admin = next(u for u in seed_users.values() if u.role.value == "admin")
    resp = await client.get("/camps", headers=auth_header(admin))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_get_nonexistent_camp(client: AsyncClient, seed_users):
    import uuid
    from tests.conftest import auth_header

    admin = next(u for u in seed_users.values() if u.role.value == "admin")
    resp = await client.get(f"/camps/{uuid.uuid4()}", headers=auth_header(admin))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_review_requires_medical_officer(client: AsyncClient, seed_users):
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
