"""
Offline sync endpoint.

Mobile devices accumulate screenings and donations during a camp
(when connectivity is absent) and push them here when they reconnect.

Conflict detection:
  - Same sync_id (UUID) → idempotent; returns existing result.
  - Same donor + screening within 2-hour window from same device → conflict.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.audit import SyncQueue
from app.models.donor import Screening
from app.models.enums import SyncStatusEnum, UserRoleEnum
from app.schemas.sync import BulkSyncRequest, BulkSyncResponse, SyncItemResult

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("", response_model=BulkSyncResponse, status_code=status.HTTP_200_OK)
async def bulk_sync(
    body: BulkSyncRequest,
    actor=Depends(require_roles(
        UserRoleEnum.DISTRICT_ADMIN,
        UserRoleEnum.SUPERADMIN,
        UserRoleEnum.DOCTOR,
    )),
    db: AsyncSession = Depends(get_db),
):
    results: list[SyncItemResult] = []
    accepted = 0
    conflicts = 0

    for item in body.items:
        # Idempotency: if sync_id already processed, return its result
        existing_queue = await db.execute(
            select(SyncQueue).where(SyncQueue.sync_id == item.sync_id)
        )
        queue_row = existing_queue.scalar_one_or_none()

        if queue_row:
            results.append(SyncItemResult(
                sync_id=item.sync_id,
                status=queue_row.status,
                entity_id=None,
                conflict_reason=queue_row.conflict_reason,
            ))
            continue

        # Conflict detection for screenings
        conflict_reason: str | None = None
        if item.entity_type == "screening":
            payload = item.payload
            donor_id_str = payload.get("donor_id")
            if donor_id_str:
                window_start = item.captured_at - timedelta(hours=2)
                conflict_check = await db.execute(
                    select(Screening).where(
                        Screening.donor_id == uuid.UUID(donor_id_str),
                        Screening.screening_datetime >= window_start,
                        Screening.screening_datetime <= item.captured_at + timedelta(hours=2),
                        Screening.sync_id != item.sync_id,
                    )
                )
                if conflict_check.scalar_one_or_none():
                    conflict_reason = "Duplicate screening: same donor within 2-hour window"

        final_status = SyncStatusEnum.CONFLICT if conflict_reason else SyncStatusEnum.PENDING

        queue_entry = SyncQueue(
            device_id=item.device_id,
            entity_type=item.entity_type,
            sync_id=item.sync_id,
            payload=item.payload,
            status=final_status,
            conflict_reason=conflict_reason,
        )
        db.add(queue_entry)
        await db.flush()

        if conflict_reason:
            conflicts += 1
        else:
            accepted += 1
            # Process inline for small payloads; large volumes would use Celery
            await _process_sync_item(queue_entry, actor.id, db)

        results.append(SyncItemResult(
            sync_id=item.sync_id,
            status=final_status,
            conflict_reason=conflict_reason,
        ))

    await db.commit()

    return BulkSyncResponse(accepted=accepted, conflicts=conflicts, results=results)


async def _process_sync_item(queue_row: SyncQueue, actor_id: uuid.UUID, db: AsyncSession) -> None:
    """Process a sync queue entry inline. Marks it processed or conflict."""
    try:
        if queue_row.entity_type == "screening":
            from app.schemas.donors import ScreeningCreateRequest
            from app.services.donors import screen_donor

            req = ScreeningCreateRequest(**queue_row.payload)
            await screen_donor(req, actor_id, db)

        queue_row.status = SyncStatusEnum.PROCESSED
        queue_row.processed_at = datetime.now(tz=timezone.utc)

    except Exception as exc:
        queue_row.status = SyncStatusEnum.CONFLICT
        queue_row.conflict_reason = str(exc)[:500]
