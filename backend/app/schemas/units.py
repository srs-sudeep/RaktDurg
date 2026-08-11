from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import (
    BloodGroupEnum,
    ComponentStateEnum,
    ComponentTypeEnum,
    TestResultEnum,
    UnitLifecycleState,
    UnitReleaseStatus,
)


# ── Test result ───────────────────────────────────────────────────────────────

class TestResultIn(BaseModel):
    test_panel: str = Field(..., min_length=1, max_length=100)
    result: TestResultEnum


class TestResultOut(TestResultIn):
    id: uuid.UUID
    unit_id: uuid.UUID
    tested_by: uuid.UUID
    tested_datetime: datetime
    released_by: uuid.UUID | None = None
    released_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class RecordTestsRequest(BaseModel):
    results: list[TestResultIn] = Field(..., min_length=1)


# ── Blood unit ─────────────────────────────────────────────────────────────────

class UnitCreateRequest(BaseModel):
    donation_id: uuid.UUID
    blood_group: BloodGroupEnum
    facility_id: uuid.UUID
    collection_datetime: datetime
    expiry_datetime: datetime


class UnitTransitionRequest(BaseModel):
    target_state: UnitLifecycleState
    reason: str | None = Field(None, max_length=500)


class UnitOut(BaseModel):
    id: uuid.UUID
    barcode: str
    donation_id: uuid.UUID
    blood_group: BloodGroupEnum
    facility_id: uuid.UUID
    collection_datetime: datetime
    expiry_datetime: datetime
    release_status: UnitReleaseStatus
    lifecycle_state: UnitLifecycleState
    discarded_reason: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BarcodeLookupResponse(BaseModel):
    unit: UnitOut
    test_results: list[TestResultOut]
    components: list[ComponentOut]


# ── Component ─────────────────────────────────────────────────────────────────

class SeparateComponentsRequest(BaseModel):
    components: list[ComponentIn] = Field(..., min_length=1)


class ComponentIn(BaseModel):
    type: ComponentTypeEnum
    volume_ml: int = Field(..., ge=10, le=600)
    expiry_datetime: datetime


class ComponentOut(BaseModel):
    id: uuid.UUID
    unit_id: uuid.UUID
    type: ComponentTypeEnum
    volume_ml: int
    blood_group: BloodGroupEnum
    expiry_datetime: datetime
    state: ComponentStateEnum
    facility_id: uuid.UUID

    model_config = {"from_attributes": True}


# ── Stock ─────────────────────────────────────────────────────────────────────

class StockEntry(BaseModel):
    blood_group: BloodGroupEnum
    component_type: ComponentTypeEnum
    available_count: int
    earliest_expiry: datetime | None = None


class StockResponse(BaseModel):
    facility_id: uuid.UUID
    entries: list[StockEntry]
    as_of: datetime
