"""
Stock routes:
  GET  /stock/{facility_id}        — authenticated stock summary
  GET  /public/stock/{facility_id} — public read (no auth), shows counts only
  GET  /stream/stock/{facility_id} — SSE stream (authenticated)
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.enums import UserRoleEnum
from app.schemas.stock import FacilityStockResponse, StockSummaryRow
from app.schemas.units import StockEntry, StockResponse
from app.services.stock import get_facility_stock

router = APIRouter(tags=["stock"])


async def _fetch_stock(db: AsyncSession, facility_id: uuid.UUID) -> list[dict]:
    return await get_facility_stock(db, facility_id)


@router.get("/stock/{facility_id}", response_model=StockResponse)
async def authenticated_stock(
    facility_id: uuid.UUID,
    _actor=Depends(require_roles(
        UserRoleEnum.ADMIN, UserRoleEnum.MEDICAL_OFFICER,
        UserRoleEnum.LAB_TECH, UserRoleEnum.INVENTORY_OFFICER,
        UserRoleEnum.PHLEBOTOMIST,
    )),
    db: AsyncSession = Depends(get_db),
):
    rows = await _fetch_stock(db, facility_id)
    return StockResponse(
        facility_id=facility_id,
        entries=[
            StockEntry(
                blood_group=r["blood_group"],
                component_type=r["component_type"],
                available_count=r["available_count"],
                earliest_expiry=r["earliest_expiry"],
            )
            for r in rows
        ],
        as_of=datetime.now(tz=timezone.utc),
    )


@router.get("/public/stock/{facility_id}", response_model=StockResponse)
async def public_stock(
    facility_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Unauthenticated endpoint — shows only count and blood group (no patient data)."""
    rows = await _fetch_stock(db, facility_id)
    return StockResponse(
        facility_id=facility_id,
        entries=[
            StockEntry(
                blood_group=r["blood_group"],
                component_type=r["component_type"],
                available_count=r["available_count"],
                earliest_expiry=None,  # not exposed publicly
            )
            for r in rows
        ],
        as_of=datetime.now(tz=timezone.utc),
    )


@router.get("/stream/stock/{facility_id}")
async def stock_sse_stream(
    facility_id: uuid.UUID,
    request: Request,
    _actor=Depends(require_roles(
        UserRoleEnum.ADMIN, UserRoleEnum.MEDICAL_OFFICER,
        UserRoleEnum.LAB_TECH, UserRoleEnum.INVENTORY_OFFICER,
    )),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-Sent Events stream.  Pushes stock snapshot on:
      - initial connect (immediate)
      - any stock change (via Redis pub/sub)
      - keepalive comment every 30 s
    """
    from redis.asyncio import Redis
    from app.config import settings

    async def event_generator():
        # Send current snapshot on connect
        rows = await _fetch_stock(db, facility_id)
        payload = json.dumps(
            {
                "facility_id": str(facility_id),
                "entries": [
                    {
                        "blood_group": r["blood_group"].value if hasattr(r["blood_group"], "value") else r["blood_group"],
                        "component_type": r["component_type"].value if hasattr(r["component_type"], "value") else r["component_type"],
                        "available_count": r["available_count"],
                    }
                    for r in rows
                ],
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            }
        )
        yield f"data: {payload}\n\n"

        redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = redis.pubsub()
        await pubsub.subscribe("stock:updates")

        try:
            while True:
                if await request.is_disconnected():
                    break

                message = await pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=1.0
                )
                if message and message.get("data"):
                    try:
                        data = json.loads(message["data"])
                        msg_fid = data.get("facility_id", "")
                    except (json.JSONDecodeError, AttributeError):
                        msg_fid = ""

                    # Only push if this message is for this facility (or broadcast)
                    if msg_fid in ("", str(facility_id)):
                        rows = await _fetch_stock(db, facility_id)
                        payload = json.dumps(
                            {
                                "facility_id": str(facility_id),
                                "entries": [
                                    {
                                        "blood_group": r["blood_group"].value if hasattr(r["blood_group"], "value") else r["blood_group"],
                                        "component_type": r["component_type"].value if hasattr(r["component_type"], "value") else r["component_type"],
                                        "available_count": r["available_count"],
                                    }
                                    for r in rows
                                ],
                                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                            }
                        )
                        yield f"data: {payload}\n\n"
                else:
                    yield ": keepalive\n\n"
                    await asyncio.sleep(29)

        finally:
            await pubsub.unsubscribe("stock:updates")
            await redis.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
