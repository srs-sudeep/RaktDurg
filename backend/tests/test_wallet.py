"""
Phase 4 tests: wallet is disabled by default (wallet_enabled = FALSE).
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_wallet_disabled_by_default(client: AsyncClient, seed_users, wallet_flag_off):
    from tests.conftest import auth_header

    admin = next(u for u in seed_users.values() if u.role.value == "admin")
    resp = await client.get(
        f"/wallet/donors/{uuid.uuid4()}",
        headers=auth_header(admin),
    )
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_wallet_credit_disabled(client: AsyncClient, seed_users, wallet_flag_off):
    from tests.conftest import auth_header

    admin = next(u for u in seed_users.values() if u.role.value == "admin")
    body = {
        "amount": 1,
        "reference_type": "donation",
        "reference_id": str(uuid.uuid4()),
    }
    resp = await client.post(
        f"/wallet/donors/{uuid.uuid4()}/credit",
        json=body,
        headers=auth_header(admin),
    )
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_wallet_requires_auth(client: AsyncClient, wallet_flag_off):
    resp = await client.get(f"/wallet/donors/{uuid.uuid4()}")
    assert resp.status_code in (401, 403)
