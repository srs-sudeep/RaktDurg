from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import BloodGroupEnum, ComponentTypeEnum, LedgerReasonEnum


class LedgerEntryOut(BaseModel):
    id: uuid.UUID
    facility_id: uuid.UUID
    blood_group: BloodGroupEnum
    component_type: ComponentTypeEnum
    change_qty: int
    reason: LedgerReasonEnum
    reference_id: uuid.UUID | None = None
    reference_type: str | None = None
    balance_after: int
    recorded_by: uuid.UUID
    recorded_at: datetime

    model_config = {"from_attributes": True}


class StockSummaryRow(BaseModel):
    blood_group: BloodGroupEnum
    component_type: ComponentTypeEnum
    balance: int


class FacilityStockResponse(BaseModel):
    facility_id: uuid.UUID
    rows: list[StockSummaryRow]
    as_of: datetime


class SSEStockEvent(BaseModel):
    event: str = "stock_update"
    facility_id: str
    entries: list[dict]
    timestamp: str
