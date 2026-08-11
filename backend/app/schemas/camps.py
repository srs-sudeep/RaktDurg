from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import CampStatusEnum


class CampApplyRequest(BaseModel):
    host_facility_id: uuid.UUID
    camp_name: str = Field(..., min_length=3, max_length=200)
    requested_date: date
    location: str = Field(..., min_length=5, max_length=500)
    expected_donors: int = Field(..., ge=1, le=1000)


class CampReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    coupon_prefix: str | None = Field(None, max_length=20)
    rejection_reason: str | None = Field(None, max_length=500)


class CampOut(BaseModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    host_facility_id: uuid.UUID
    camp_name: str
    requested_date: date
    location: str
    expected_donors: int
    status: CampStatusEnum
    coupon_prefix: str | None
    approved_by: uuid.UUID | None
    approval_datetime: datetime | None
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CampListResponse(BaseModel):
    items: list[CampOut]
    total: int
    page: int
    page_size: int


class CouponOut(BaseModel):
    id: uuid.UUID
    camp_id: uuid.UUID
    coupon_code: str
    is_used: bool
    used_by_donor_id: uuid.UUID | None

    model_config = {"from_attributes": True}
