from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import (
    BloodGroupEnum,
    ComponentTypeEnum,
    RequisitionPriorityEnum,
    RequisitionStatusEnum,
)


class RequisitionCreateRequest(BaseModel):
    facility_id: uuid.UUID
    patient_name: str = Field(..., min_length=2, max_length=200)
    patient_hospital_id: str = Field(..., min_length=1, max_length=50)
    blood_group: BloodGroupEnum
    component_type: ComponentTypeEnum
    units_requested: int = Field(..., ge=1, le=20)
    priority: RequisitionPriorityEnum
    clinical_indication: str = Field(..., min_length=5, max_length=500)


class RequisitionOut(BaseModel):
    id: uuid.UUID
    facility_id: uuid.UUID
    patient_name: str
    patient_hospital_id: str
    blood_group: BloodGroupEnum
    component_type: ComponentTypeEnum
    units_requested: int
    priority: RequisitionPriorityEnum
    status: RequisitionStatusEnum
    clinical_indication: str
    requested_by: uuid.UUID
    requested_at: datetime
    fulfilled_at: datetime | None

    model_config = {"from_attributes": True}


class RequisitionListResponse(BaseModel):
    items: list[RequisitionOut]
    total: int
    page: int
    page_size: int


class IssueOut(BaseModel):
    id: uuid.UUID
    requisition_id: uuid.UUID
    component_id: uuid.UUID
    issued_by: uuid.UUID
    issue_datetime: datetime
    transfusion_datetime: datetime | None
    outcome: str | None

    model_config = {"from_attributes": True}


class TransfusionRequest(BaseModel):
    transfusion_datetime: datetime
    outcome: str = Field(..., min_length=2, max_length=100)
    outcome_notes: str | None = Field(None, max_length=1000)
