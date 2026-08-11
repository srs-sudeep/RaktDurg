from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import SyncStatusEnum


class SyncPayloadItem(BaseModel):
    entity_type: str = Field(..., pattern="^(screening|donation)$")
    sync_id: uuid.UUID
    device_id: str = Field(..., min_length=1, max_length=100)
    captured_at: datetime
    payload: dict


class BulkSyncRequest(BaseModel):
    items: list[SyncPayloadItem] = Field(..., min_length=1, max_length=100)


class SyncItemResult(BaseModel):
    sync_id: uuid.UUID
    status: SyncStatusEnum
    entity_id: uuid.UUID | None = None
    conflict_reason: str | None = None


class BulkSyncResponse(BaseModel):
    accepted: int
    conflicts: int
    results: list[SyncItemResult]
