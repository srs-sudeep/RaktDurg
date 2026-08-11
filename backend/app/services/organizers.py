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
) -> tuple[list[Organizer], int]:
    count = (
        await db.execute(select(func.count()).select_from(Organizer))
    ).scalar_one()
    rows = (
        await db.execute(
            select(Organizer)
            .order_by(Organizer.org_name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    return list(rows), count


async def list_organizer_directory(
    db: AsyncSession,
    *,
    category: OrgCategoryEnum | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[OrganizerDirectory], int]:
    stmt = select(OrganizerDirectory)
    if category is not None:
        stmt = stmt.where(OrganizerDirectory.category == category)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            OrganizerDirectory.org_name.ilike(pattern)
            | OrganizerDirectory.mobile.ilike(pattern)
        )

    count = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(
                OrganizerDirectory.source_serial.asc().nulls_last(),
                OrganizerDirectory.org_name.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    return list(rows), count
