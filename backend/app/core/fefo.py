"""
FEFO (First-Expiry-First-Out) component reservation.

Uses SELECT … FOR UPDATE SKIP LOCKED for safe concurrent reservations:
  - SKIP LOCKED means two concurrent requests won't fight over the same component.
  - FOR UPDATE means the row is locked until the transaction commits or rolls back.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import now

from app.models.enums import BloodGroupEnum, ComponentStateEnum, ComponentTypeEnum
from app.models.unit import Component


async def reserve_fefo(
    db: AsyncSession,
    facility_id: uuid.UUID,
    blood_group: BloodGroupEnum,
    component_type: ComponentTypeEnum,
    quantity: int,
) -> list[Component]:
    """
    Return up to `quantity` available components in FEFO order, locked for update.
    The caller is responsible for updating their state and committing.
    Returns fewer than `quantity` items if stock is insufficient.
    """
    stmt = (
        select(Component)
        .where(
            Component.facility_id == facility_id,
            Component.blood_group == blood_group,
            Component.type == component_type,
            Component.state == ComponentStateEnum.AVAILABLE,
            Component.expiry_datetime > now(),
        )
        .order_by(Component.expiry_datetime.asc())
        .limit(quantity)
        .with_for_update(skip_locked=True)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def current_stock(
    db: AsyncSession,
    facility_id: uuid.UUID,
) -> list[dict]:
    """
    Current available component counts per (blood_group, type).
    Uses the components table directly (source of truth for availability).
    """
    from sqlalchemy import func, text

    stmt = (
        select(
            Component.blood_group,
            Component.type,
            func.count().label("available_count"),
            func.min(Component.expiry_datetime).label("earliest_expiry"),
        )
        .where(
            Component.facility_id == facility_id,
            Component.state == ComponentStateEnum.AVAILABLE,
            Component.expiry_datetime > now(),
        )
        .group_by(Component.blood_group, Component.type)
        .order_by(Component.blood_group, Component.type)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "blood_group": r.blood_group,
            "component_type": r.type,
            "available_count": r.available_count,
            "earliest_expiry": r.earliest_expiry,
        }
        for r in rows
    ]
