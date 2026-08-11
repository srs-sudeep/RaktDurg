"""Audit middleware tests — verify write operations produce audit log entries."""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.enums import UserRoleEnum
from app.models.auth import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_login_write_produces_audit_entry(
    client: AsyncClient,
    db: AsyncSession,
    seed_users: dict[UserRoleEnum, User],
):
    """POST /auth/token is a write — audit middleware should capture it."""
    before_count_result = await db.execute(select(AuditLog))
    before_count = len(before_count_result.scalars().all())

    await client.post(
        "/auth/token", json={"username": "test_superadmin", "password": "testpass123"}
    )

    db.expire_all()
    after_count_result = await db.execute(select(AuditLog))
    after_count = len(after_count_result.scalars().all())

    assert after_count > before_count, "Expected at least one audit entry after a POST"


@pytest.mark.asyncio
async def test_audit_entry_has_actor_after_authenticated_post(
    client: AsyncClient,
    db: AsyncSession,
    seed_users: dict[UserRoleEnum, User],
):
    """An authenticated POST should record the actor_id in the audit log."""
    admin = seed_users[UserRoleEnum.SUPERADMIN]
    admin_id = admin.id

    # Login to get a refresh token (POST with valid auth)
    await client.post(
        "/auth/logout",
        json={"refresh_token": "nonexistent"},
        headers=auth_header(admin),
    )

    db.expire_all()
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5)
    )
    entries = result.scalars().all()

    actor_entries = [e for e in entries if e.actor_id == admin_id]
    assert len(actor_entries) >= 1, "Expected at least one audit entry with admin's actor_id"


@pytest.mark.asyncio
async def test_audit_log_cannot_be_deleted(db: AsyncSession):
    """The DELETE rule on audit_logs should silently prevent deletion."""
    from sqlalchemy import text

    # Insert a test audit entry directly
    await db.execute(
        text(
            "INSERT INTO audit_logs (actor_type, action, entity_type, entity_id) "
            "VALUES ('system', 'test.action', 'test', gen_random_uuid())"
        )
    )
    await db.flush()

    count_before = (
        await db.execute(text("SELECT COUNT(*) FROM audit_logs WHERE action='test.action'"))
    ).scalar()

    # Attempt to delete — the rule should silently ignore it
    await db.execute(text("DELETE FROM audit_logs WHERE action='test.action'"))
    await db.flush()

    count_after = (
        await db.execute(text("SELECT COUNT(*) FROM audit_logs WHERE action='test.action'"))
    ).scalar()

    assert count_before == count_after, "DELETE rule should prevent audit log deletion"


@pytest.mark.asyncio
async def test_audit_entry_fields_populated(
    client: AsyncClient,
    db: AsyncSession,
    seed_users: dict[UserRoleEnum, User],
):
    """Each audit entry should have action, entity_type, entity_id, and timestamp populated."""
    await client.post(
        "/auth/token", json={"username": "test_superadmin", "password": "testpass123"}
    )
    db.expire_all()

    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(1))
    entry = result.scalar_one_or_none()

    assert entry is not None
    assert entry.action is not None and len(entry.action) > 0
    assert entry.entity_type is not None
    assert entry.entity_id is not None
    assert entry.timestamp is not None
    assert entry.actor_type is not None
