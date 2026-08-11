from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.enums import OrgCategoryEnum, UserRoleEnum
from app.schemas.organizers import (
    OrganizerDirectoryListResponse,
    OrganizerDirectoryOut,
    OrganizerListResponse,
    OrganizerOut,
    OrganizerUpdateRequest,
)
from app.services.organizers import (
    OrganizerNotFound,
    get_organizer_for_user,
    list_organizer_directory,
    list_organizers,
    update_organizer_me,
)

router = APIRouter(tags=["organizers"])

_STAFF = (
    UserRoleEnum.SUPERADMIN,
    UserRoleEnum.DOCTOR,
    UserRoleEnum.DISTRICT_ADMIN,
)


@router.get("/organizers/me", response_model=OrganizerOut)
async def get_me(
    actor=Depends(require_roles(UserRoleEnum.ORGANIZER, UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        organizer = await get_organizer_for_user(actor.id, db)
    except OrganizerNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return organizer


@router.patch("/organizers/me", response_model=OrganizerOut)
async def patch_me(
    body: OrganizerUpdateRequest,
    actor=Depends(require_roles(UserRoleEnum.ORGANIZER, UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        organizer = await update_organizer_me(actor.id, body, db)
    except OrganizerNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    await db.commit()
    await db.refresh(organizer)
    return organizer


@router.get("/admin/organizers", response_model=OrganizerListResponse)
async def admin_list_organizers(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _actor=Depends(require_roles(*_STAFF)),
    db: AsyncSession = Depends(get_db),
):
    rows, total = await list_organizers(db, page=page, page_size=page_size)
    return OrganizerListResponse(
        items=[OrganizerOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/admin/organizer-directory", response_model=OrganizerDirectoryListResponse)
async def admin_organizer_directory(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    category: OrgCategoryEnum | None = None,
    q: str | None = Query(None, max_length=100),
    _actor=Depends(require_roles(*_STAFF)),
    db: AsyncSession = Depends(get_db),
):
    rows, total = await list_organizer_directory(
        db, category=category, q=q, page=page, page_size=page_size
    )
    return OrganizerDirectoryListResponse(
        items=[OrganizerDirectoryOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )
