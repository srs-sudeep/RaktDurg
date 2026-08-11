"""
Test fixtures.

Requires a running PostgreSQL instance. Set TEST_DATABASE_URL in .env or the environment.
The fixture creates all tables fresh for each test session and drops them afterwards.
A separate test database (rakt_durg_test) is used — never the dev database.
"""

import asyncio
from typing import AsyncGenerator

from datetime import date

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import get_db
from app.main import app
from app.models import Base
from app.models.audit import FeatureFlag
from app.models.donor import Donor
from app.models.enums import BloodGroupEnum, DonorStatusEnum, SexEnum, UserRoleEnum
from app.models.facility import Facility
from app.models.auth import User
from app.services.auth import hash_password, create_access_token


# ── Engine (session-scoped — created once per test run) ───────────────────────

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(settings.TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            __import__("sqlalchemy").text(
                "CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING"
            )
        )
        await conn.execute(
            __import__("sqlalchemy").text(
                "CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING"
            )
        )

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def session_factory(test_engine):
    return async_sessionmaker(test_engine, expire_on_commit=False)


# ── Per-test DB session (rolls back after each test) ──────────────────────────

@pytest_asyncio.fixture
async def db(session_factory) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session
        await session.rollback()


# ── HTTP client ───────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Seed data fixtures ────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def facility(db: AsyncSession) -> Facility:
    f = Facility(
        name="Test Blood Bank",
        facility_code="TSTFAC",
        type="blood_bank",
        district="Durg",
    )
    db.add(f)
    await db.flush()
    return f


@pytest_asyncio.fixture
async def seed_users(db: AsyncSession, facility: Facility) -> dict[UserRoleEnum, User]:
    users: dict[UserRoleEnum, User] = {}
    for role in UserRoleEnum:
        user = User(
            facility_id=facility.id if role not in (
                UserRoleEnum.ORGANIZER, UserRoleEnum.CITIZEN
            ) else None,
            role=role,
            username=f"test_{role.value}",
            email=f"test_{role.value}@test.local",
            hashed_password=hash_password("testpass123"),
            is_active=True,
        )
        db.add(user)
        users[role] = user
    await db.flush()
    citizen = users[UserRoleEnum.CITIZEN]
    db.add(
        Donor(
            name="Citizen Test User",
            date_of_birth=date(1995, 1, 1),
            age_years=30,
            sex=SexEnum.MALE,
            contact_phone="9999999999",
            address="Durg",
            blood_group=BloodGroupEnum.O_POS,
            status=DonorStatusEnum.ACTIVE,
            consent_given=True,
            consent_purpose="blood_donation_registration",
            registered_at_facility_id=facility.id,
            user_id=citizen.id,
            created_by=users[UserRoleEnum.SUPERADMIN].id,
        )
    )
    await db.flush()
    return users


@pytest_asyncio.fixture
async def wallet_flag_off(db: AsyncSession) -> None:
    """Ensure wallet feature flag is disabled."""
    from sqlalchemy import select
    result = await db.execute(
        select(FeatureFlag).where(FeatureFlag.name == "wallet_enabled")
    )
    flag = result.scalar_one_or_none()
    if flag is None:
        db.add(FeatureFlag(name="wallet_enabled", is_enabled=False))
    else:
        flag.is_enabled = False
    await db.flush()


# ── Auth header helpers ───────────────────────────────────────────────────────

def auth_header(user: User) -> dict[str, str]:
    token, _ = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}
