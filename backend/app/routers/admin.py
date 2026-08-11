"""
Admin endpoints:
  - e-RaktKosh manual export trigger
  - Feature flag management
  - User directory (superadmin)
"""

from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.erakkosh import build_daily_payload, export_daily
from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.audit import FeatureFlag
from app.models.auth import User
from app.models.enums import UserRoleEnum
from app.schemas.auth import AdminUserListResponse, AdminUserOut, AdminUserUpdateRequest
from app.schemas.staff import CitizenLinkRequest, CitizenLinkOut
from app.services.staff import StaffActionError, link_citizen_account

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/erakkosh/export")
async def trigger_export(
    export_date: date | None = None,
    _actor=Depends(require_roles(UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger e-RaktKosh daily export for a given date (defaults to today)."""
    target = export_date or date.today()
    payload = await build_daily_payload(db)
    submission_id = await export_daily(target, payload)
    return {"submission_id": submission_id, "export_date": target.isoformat()}


@router.get("/feature-flags")
async def list_flags(
    _actor=Depends(require_roles(UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FeatureFlag))
    flags = result.scalars().all()
    return [{"name": f.name, "is_enabled": f.is_enabled, "description": f.description} for f in flags]


@router.patch("/feature-flags/{name}")
async def toggle_flag(
    name: str,
    is_enabled: bool,
    actor=Depends(require_roles(UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.name == name))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404, detail=f"Feature flag '{name}' not found")

    flag.is_enabled = is_enabled
    flag.updated_by = actor.id
    from datetime import datetime, timezone
    flag.updated_at = datetime.now(tz=timezone.utc)
    await db.commit()
    return {"name": flag.name, "is_enabled": flag.is_enabled}


@router.post("/citizens/link", response_model=CitizenLinkOut)
async def link_citizen(
    body: CitizenLinkRequest,
    actor=Depends(require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DISTRICT_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Link a citizen login to an existing donor profile (staff onboarding)."""
    try:
        result = await link_citizen_account(body.username, body.donor_id, actor, db)
    except StaffActionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    await db.commit()
    return result


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    role: UserRoleEnum | None = None,
    q: str | None = Query(None, max_length=100),
    _actor=Depends(require_roles(UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User)
    if role is not None:
        stmt = stmt.where(User.role == role)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            User.username.ilike(pattern)
            | User.display_name.ilike(pattern)
            | User.email.ilike(pattern)
        )

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(User.role.asc(), User.username.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    return AdminUserListResponse(
        items=[AdminUserOut.model_validate(u) for u in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: uuid.UUID,
    body: AdminUserUpdateRequest,
    actor=Depends(require_roles(UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == actor.id and body.is_active is False:
        raise HTTPException(status_code=422, detail="Cannot deactivate your own account")

    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return AdminUserOut.model_validate(user)
