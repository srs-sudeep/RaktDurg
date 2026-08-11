from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.donor import Organizer, OrganizerDirectory
from app.models.enums import OrgCategoryEnum
from app.schemas.organizers import OrganizerUpdateRequest


class OrganizerNotFound(Exception):
    pass


async def get_organizer_for_user(user_id: uuid.UUID, db: AsyncSession) -> Organizer:
    result = await db.execute(select(Organizer).where(Organizer.user_id == user_id))
    organizer = result.scalar_one_or_none()
    if organizer is None:
        raise OrganizerNotFound("Organizer profile not found for this account")
    return organizer


async def update_organizer_me(
    user_id: uuid.UUID,
    body: OrganizerUpdateRequest,
    db: AsyncSession,
) -> Organizer:
    organizer = await get_organizer_for_user(user_id, db)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(organizer, key, value)
    await db.flush()
    return organizer


async def list_organizers(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 50,
    q: str | None = None,
    org_category: OrgCategoryEnum | None = None,
    is_verified: bool | None = None,
    order_by: str | None = None,
    order: str | None = "asc",
) -> tuple[list[Organizer], int]:
    from app.core.query import apply_ilike_search, apply_order

    stmt = select(Organizer)
    if org_category is not None:
        stmt = stmt.where(Organizer.org_category == org_category)
    if is_verified is not None:
        stmt = stmt.where(Organizer.is_verified == is_verified)
    stmt = apply_ilike_search(
        stmt, q, Organizer.org_name, Organizer.contact_name, Organizer.contact_phone
    )

    count = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()
    stmt = apply_order(
        stmt,
        order_by=order_by,
        order=order,
        allowlist={
            "org_name": Organizer.org_name,
            "created_at": Organizer.created_at,
            "org_category": Organizer.org_category,
            "is_verified": Organizer.is_verified,
        },
        default="org_name",
        default_dir="asc",
    )
    rows = (
        await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return list(rows), count


async def list_organizer_directory(
    db: AsyncSession,
    *,
    category: OrgCategoryEnum | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 50,
    order_by: str | None = None,
    order: str | None = "asc",
) -> tuple[list[OrganizerDirectory], int]:
    from app.core.query import apply_ilike_search, apply_order

    stmt = select(OrganizerDirectory)
    if category is not None:
        stmt = stmt.where(OrganizerDirectory.category == category)
    stmt = apply_ilike_search(
        stmt, q, OrganizerDirectory.org_name, OrganizerDirectory.mobile
    )

    count = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()
    stmt = apply_order(
        stmt,
        order_by=order_by,
        order=order,
        allowlist={
            "source_serial": OrganizerDirectory.source_serial,
            "org_name": OrganizerDirectory.org_name,
            "category": OrganizerDirectory.category,
            "location": OrganizerDirectory.location,
        },
        default="source_serial",
        default_dir="asc",
    )
    rows = (
        await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return list(rows), count
