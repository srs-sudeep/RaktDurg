"""
Phase 5 tests: requisition creation, reserve, issue, cancel.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_requisition_requires_auth(client: AsyncClient, facility):
    payload = {
        "facility_id": str(facility.id),
        "patient_name": "Test Patient",
        "patient_hospital_id": "DGH-001",
        "blood_group": "A+",
        "component_type": "prbc",
        "units_requested": 2,
        "priority": "urgent",
        "clinical_indication": "Severe anaemia requiring transfusion",
    }
    resp = await client.post("/requisitions", json=payload)
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_requisition_medical_officer(client: AsyncClient, seed_users, facility):
    from tests.conftest import auth_header

    mo = next(u for u in seed_users.values() if u.role.value == "medical_officer")
    payload = {
        "facility_id": str(facility.id),
        "patient_name": "Ramesh Kumar",
        "patient_hospital_id": "DGH-1234",
        "blood_group": "A+",
        "component_type": "prbc",
        "units_requested": 2,
        "priority": "urgent",
        "clinical_indication": "Post-operative haemorrhage requiring transfusion",
    }
    resp = await client.post("/requisitions", json=payload, headers=auth_header(mo))
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["patient_name"] == "Ramesh Kumar"


@pytest.mark.asyncio
async def test_citizen_cannot_create_requisition(client: AsyncClient, seed_users, facility):
    from tests.conftest import auth_header

    citizen = next(u for u in seed_users.values() if u.role.value == "citizen_read")
    payload = {
        "facility_id": str(facility.id),
        "patient_name": "Test",
        "patient_hospital_id": "X",
        "blood_group": "B+",
        "component_type": "prbc",
        "units_requested": 1,
        "priority": "routine",
        "clinical_indication": "Test indication text here",
    }
    resp = await client.post("/requisitions", json=payload, headers=auth_header(citizen))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_requisitions(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    mo = next(u for u in seed_users.values() if u.role.value == "medical_officer")
    resp = await client.get("/requisitions", headers=auth_header(mo))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_reserve_on_nonexistent_fails(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    mo = next(u for u in seed_users.values() if u.role.value == "medical_officer")
    resp = await client.post(f"/requisitions/{uuid.uuid4()}/reserve", headers=auth_header(mo))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cancel_pending_requisition(client: AsyncClient, seed_users, facility):
    from tests.conftest import auth_header

    mo = next(u for u in seed_users.values() if u.role.value == "medical_officer")
    headers = auth_header(mo)

    # Create
    payload = {
        "facility_id": str(facility.id),
        "patient_name": "Cancel Test Patient",
        "patient_hospital_id": "DGH-9999",
        "blood_group": "O-",
        "component_type": "prbc",
        "units_requested": 1,
        "priority": "routine",
        "clinical_indication": "Test cancellation scenario",
    }
    create_resp = await client.post("/requisitions", json=payload, headers=headers)
    assert create_resp.status_code == 201
    req_id = create_resp.json()["id"]

    # Cancel
    cancel_resp = await client.post(f"/requisitions/{req_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_admin_export_trigger(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    admin = next(u for u in seed_users.values() if u.role.value == "admin")
    resp = await client.post("/admin/erakkosh/export", headers=auth_header(admin))
    assert resp.status_code == 200
    data = resp.json()
    assert "submission_id" in data


@pytest.mark.asyncio
async def test_feature_flags_admin_only(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    citizen = next(u for u in seed_users.values() if u.role.value == "citizen_read")
    resp = await client.get("/admin/feature-flags", headers=auth_header(citizen))
    assert resp.status_code == 403

    admin = next(u for u in seed_users.values() if u.role.value == "admin")
    resp = await client.get("/admin/feature-flags", headers=auth_header(admin))
    assert resp.status_code == 200
    flags = resp.json()
    wallet_flag = next((f for f in flags if f["name"] == "wallet_enabled"), None)
    assert wallet_flag is not None
    assert wallet_flag["is_enabled"] is False
