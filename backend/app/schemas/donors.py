from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import (
    BloodGroupEnum,
    DonorStatusEnum,
    EligibilityResultEnum,
    SexEnum,
)


# ── Donor ─────────────────────────────────────────────────────────────────────

class DonorCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    date_of_birth: date
    sex: SexEnum
    contact_phone: str = Field(..., min_length=10, max_length=20)
    address: str = Field(..., min_length=5, max_length=500)
    blood_group: BloodGroupEnum
    abha_reference: str | None = Field(None, max_length=50)
    consent_given: bool = Field(True)
    consent_purpose: str = Field("blood_donation_registration", max_length=200)


class DonorUpdateRequest(BaseModel):
    contact_phone: str | None = Field(None, max_length=20)
    address: str | None = Field(None, max_length=500)
    status: DonorStatusEnum | None = None


class DonorOut(BaseModel):
    id: uuid.UUID
    name: str
    date_of_birth: date
    age_years: int | None
    sex: SexEnum
    contact_phone: str
    blood_group: BloodGroupEnum
    status: DonorStatusEnum
    abha_reference: str | None = None
    abha_verified: bool
    consent_given: bool
    registered_at_facility_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class DonorListResponse(BaseModel):
    items: list[DonorOut]
    total: int
    page: int
    page_size: int


# ── Screening ─────────────────────────────────────────────────────────────────

class VitalsIn(BaseModel):
    weight_kg: float = Field(..., ge=30, le=200)
    bp_systolic: int = Field(..., ge=60, le=220)
    bp_diastolic: int = Field(..., ge=40, le=140)
    pulse_bpm: int = Field(..., ge=30, le=200)
    temperature_celsius: float = Field(..., ge=35.0, le=42.0)
    hemoglobin_g_dl: float = Field(..., ge=5.0, le=25.0)


class QuestionnaireIn(BaseModel):
    had_recent_illness: bool = False
    had_recent_surgery: bool = False
    is_pregnant: bool = False
    had_tattoo_last_6m: bool = False
    had_sti: bool = False
    is_on_medication: bool = False


class ScreeningCreateRequest(BaseModel):
    donor_id: uuid.UUID
    camp_id: uuid.UUID | None = None
    screening_datetime: datetime
    vitals: VitalsIn
    questionnaire: QuestionnaireIn
    captured_offline: bool = False
    device_id: str | None = Field(None, max_length=100)
    sync_id: uuid.UUID | None = None


class ScreeningOut(BaseModel):
    id: uuid.UUID
    donor_id: uuid.UUID
    camp_id: uuid.UUID | None
    screened_by: uuid.UUID
    screening_datetime: datetime
    eligibility_result: EligibilityResultEnum
    deferral_reason: str | None
    deferral_until: date | None
    captured_offline: bool
    synced_at: datetime | None

    model_config = {"from_attributes": True}
