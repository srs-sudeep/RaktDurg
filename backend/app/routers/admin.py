"""
Admin endpoints:
  - e-RaktKosh manual export trigger
  - Feature flag management
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.erakkosh import build_daily_payload, export_daily
from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.audit import FeatureFlag
from app.models.enums import UserRoleEnum
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
