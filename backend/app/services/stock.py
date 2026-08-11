"""
Stock ledger service.

Every stock change is recorded as an immutable ledger entry.
Current stock = latest balance_after per (facility, blood_group, component_type).

After each write, a Redis pub/sub notification is published to
'stock:updates' so SSE subscribers receive a push within ~1 s.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.fefo import current_stock
from app.models.enums import BloodGroupEnum, ComponentTypeEnum, LedgerReasonEnum
from app.models.stock import StockLedger


async def post_ledger_entry(
    db: AsyncSession,
    facility_id: uuid.UUID,
    blood_group: BloodGroupEnum,
    component_type: ComponentTypeEnum,
    change_qty: int,
    reason: LedgerReasonEnum,
    reference_id: uuid.UUID | None,
    reference_type: str | None,
    recorded_by: uuid.UUID,
) -> StockLedger:
    prev_balance = await _latest_balance(db, facility_id, blood_group, component_type)
    new_balance = prev_balance + change_qty

    entry = StockLedger(
        facility_id=facility_id,
        blood_group=blood_group,
        component_type=component_type,
        change_qty=change_qty,
        reason=reason,
        reference_id=reference_id,
        reference_type=reference_type,
        balance_after=new_balance,
        recorded_by=recorded_by,
        recorded_at=datetime.now(tz=timezone.utc),
    )
    db.add(entry)
    await db.flush()

    # Fire-and-forget Redis notification (non-blocking, best-effort)
    try:
        await _notify_redis(str(facility_id))
    except Exception:
        pass  # Stock still updated; notification failure is non-critical

    return entry


async def _latest_balance(
    db: AsyncSession,
    facility_id: uuid.UUID,
    blood_group: BloodGroupEnum,
    component_type: ComponentTypeEnum,
) -> int:
    stmt = (
        select(StockLedger.balance_after)
        .where(
            StockLedger.facility_id == facility_id,
            StockLedger.blood_group == blood_group,
            StockLedger.component_type == component_type,
        )
        .order_by(StockLedger.recorded_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    value = result.scalar_one_or_none()
    return value if value is not None else 0


async def get_facility_stock(db: AsyncSession, facility_id: uuid.UUID) -> list[dict]:
    return await current_stock(db, facility_id)


async def _notify_redis(facility_id: str) -> None:
    from redis.asyncio import Redis
    from app.config import settings

    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        payload = json.dumps({"facility_id": facility_id, "ts": datetime.now(tz=timezone.utc).isoformat()})
        await redis.publish("stock:updates", payload)
    finally:
        await redis.aclose()
