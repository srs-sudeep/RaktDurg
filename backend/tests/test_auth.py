"""Auth + RBAC tests covering Phase 0 acceptance criteria."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRoleEnum
from app.models.facility import Facility
from app.models.auth import User
from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


class TestLogin:
    async def test_valid_login_returns_tokens(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        resp = await client.post(
            "/auth/token", json={"username": "test_admin", "password": "testpass123"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"
        assert body["expires_in"] > 0

    async def test_wrong_password_returns_401(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        resp = await client.post(
            "/auth/token", json={"username": "test_admin", "password": "wrong"}
        )
        assert resp.status_code == 401

    async def test_unknown_user_returns_401(self, client: AsyncClient):
        resp = await client.post(
            "/auth/token", json={"username": "nobody", "password": "pass"}
        )
        assert resp.status_code == 401


class TestRefresh:
    async def test_refresh_returns_new_access_token(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        login = await client.post(
            "/auth/token", json={"username": "test_admin", "password": "testpass123"}
        )
        refresh_token = login.json()["refresh_token"]

        resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_used_refresh_token_rejected(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        login = await client.post(
            "/auth/token", json={"username": "test_admin", "password": "testpass123"}
        )
        refresh_token = login.json()["refresh_token"]

        # Use the refresh token once
        await client.post("/auth/refresh", json={"refresh_token": refresh_token})

        # Second use of same token must fail (rotation invalidates it)
        resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 401


class TestLogout:
    async def test_logout_revokes_token(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        login = await client.post(
            "/auth/token", json={"username": "test_admin", "password": "testpass123"}
        )
        refresh_token = login.json()["refresh_token"]

        logout = await client.post("/auth/logout", json={"refresh_token": refresh_token})
        assert logout.status_code == 200

        # Revoked token cannot be used for refresh
        resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 401


class TestMe:
    async def test_me_returns_current_user(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        admin = seed_users[UserRoleEnum.ADMIN]
        resp = await client.get("/auth/me", headers=auth_header(admin))
        assert resp.status_code == 200
        body = resp.json()
        assert body["username"] == "test_admin"
        assert body["role"] == UserRoleEnum.ADMIN.value

    async def test_me_without_token_returns_403(self, client: AsyncClient):
        resp = await client.get("/auth/me")
        assert resp.status_code in (401, 403)

    async def test_me_with_bad_token_returns_401(self, client: AsyncClient):
        resp = await client.get("/auth/me", headers={"Authorization": "Bearer bad.token.here"})
        assert resp.status_code == 401


class TestRBAC:
    """Verify that the RBAC role matrix works across multiple roles."""

    @pytest.mark.parametrize(
        "role",
        [
            UserRoleEnum.ADMIN,
            UserRoleEnum.MEDICAL_OFFICER,
            UserRoleEnum.LAB_TECH,
            UserRoleEnum.PHLEBOTOMIST,
            UserRoleEnum.INVENTORY_OFFICER,
            UserRoleEnum.ORGANIZER,
            UserRoleEnum.DONOR,
            UserRoleEnum.CITIZEN_READ,
        ],
    )
    async def test_any_role_can_reach_health(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User], role: UserRoleEnum
    ):
        resp = await client.get("/health", headers=auth_header(seed_users[role]))
        assert resp.status_code == 200

    async def test_correct_role_in_me_response(
        self, client: AsyncClient, seed_users: dict[UserRoleEnum, User]
    ):
        for role, user in seed_users.items():
            resp = await client.get("/auth/me", headers=auth_header(user))
            assert resp.status_code == 200
            assert resp.json()["role"] == role.value


class TestFeatureFlag:
    async def test_wallet_flag_is_disabled_by_default(
        self, db: AsyncSession, wallet_flag_off
    ):
        from sqlalchemy import select
        from app.models.audit import FeatureFlag

        result = await db.execute(
            select(FeatureFlag).where(FeatureFlag.name == "wallet_enabled")
        )
        flag = result.scalar_one_or_none()
        assert flag is not None
        assert flag.is_enabled is False
