"""
Phase 2 tests: offline sync endpoint.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sync_requires_auth(client: AsyncClient):
    resp = await client.post("/sync", json={"items": []})
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_sync_citizen_forbidden(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    citizen = next(u for u in seed_users.values() if u.role.value == "citizen")
    resp = await client.post(
        "/sync",
        json={"items": []},
        headers=auth_header(citizen),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_sync_empty_items_rejected(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    district_admin = next(u for u in seed_users.values() if u.role.value == "district_admin")
    resp = await client.post(
        "/sync",
        json={"items": []},
        headers=auth_header(district_admin),
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_sync_idempotent_same_sync_id(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    district_admin = next(u for u in seed_users.values() if u.role.value == "district_admin")
    headers = auth_header(district_admin)
    sync_id = str(uuid.uuid4())
    now = datetime.now(tz=timezone.utc).isoformat()

    item = {
        "entity_type": "screening",
        "sync_id": sync_id,
        "device_id": "device-001",
        "captured_at": now,
        "payload": {"donor_id": str(uuid.uuid4())},
    }

    resp1 = await client.post("/sync", json={"items": [item]}, headers=headers)
    assert resp1.status_code == 200

    resp2 = await client.post("/sync", json={"items": [item]}, headers=headers)
    assert resp2.status_code == 200

    data1 = resp1.json()
    data2 = resp2.json()
    # Second call returns the same sync_id result
    ids1 = {r["sync_id"] for r in data1["results"]}
    ids2 = {r["sync_id"] for r in data2["results"]}
    assert ids1 == ids2
