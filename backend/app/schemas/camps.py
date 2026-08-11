from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import CampStatusEnum, VenueModeEnum

DISTRICT_BB_LOCATION = "District Hospital Blood Bank, Durg"


class CampApplyRequest(BaseModel):
    host_facility_id: uuid.UUID
    camp_name: str = Field(..., min_length=3, max_length=200)
    requested_date: date
    venue_mode: VenueModeEnum = VenueModeEnum.DISTRICT_BLOOD_BANK
    location: str | None = Field(None, min_length=5, max_length=500)
    expected_donors: int = Field(..., ge=1, le=1000)
    alternate_dates: list[date] | None = None
    special_date_note: str | None = Field(None, max_length=300)
    camps_per_year: int | None = Field(None, ge=1, le=52)
    notes: str | None = Field(None, max_length=2000)

    @field_validator("alternate_dates")
    @classmethod
    def _dedupe_dates(cls, value: list[date] | None) -> list[date] | None:
        if value is None:
            return None
        # Preserve order, drop duplicates
        seen: set[date] = set()
        out: list[date] = []
        for d in value:
            if d not in seen:
                seen.add(d)
                out.append(d)
        return out

    @model_validator(mode="after")
    def _validate_venue_and_capacity(self) -> CampApplyRequest:
        if self.venue_mode == VenueModeEnum.ORGANIZER_VENUE and not self.location:
            raise ValueError("location is required when venue_mode is organizer_venue")
        if self.expected_donors > 350 and not self.alternate_dates:
            raise ValueError(
                "Camps expecting more than 350 donors require at least one alternate date"
            )
        return self


class CampReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    coupon_prefix: str | None = Field(None, max_length=20)
    rejection_reason: str | None = Field(None, max_length=500)


class CampOut(BaseModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    host_facility_id: uuid.UUID
    camp_name: str | None
    requested_date: date
    location: str
    expected_donors: int | None
    venue_mode: VenueModeEnum
    alternate_dates: list[date] | None = None
    special_date_note: str | None = None
    camps_per_year: int | None = None
    notes: str | None = None
    status: CampStatusEnum
    coupon_prefix: str | None
    approved_by: uuid.UUID | None
    approval_datetime: datetime | None
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("alternate_dates", mode="before")
    @classmethod
    def _parse_alternate_dates(cls, value: object) -> list[date] | None:
        if value is None:
            return None
        if not isinstance(value, list):
            return None
        out: list[date] = []
        for item in value:
            if isinstance(item, date):
                out.append(item)
            elif isinstance(item, str):
                out.append(date.fromisoformat(item))
        return out


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
