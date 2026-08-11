from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class CitizenLinkRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=100)
    donor_id: uuid.UUID


class CitizenLinkOut(BaseModel):
    user_id: uuid.UUID
    username: str
    donor_id: uuid.UUID
    donor_name: str


class BookingReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(confirm|reject)$")
    review_notes: str | None = Field(None, max_length=500)


class StaffCampBookingOut(BaseModel):
    id: uuid.UUID
    camp_id: uuid.UUID
    camp_name: str
    requested_date: date
    location: str
    donor_id: uuid.UUID
    donor_name: str
    donor_phone: str
    blood_group: str | None
    status: str
    notes: str | None
    review_notes: str | None
    reviewed_at: datetime | None
    created_at: datetime
