from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import BloodGroupEnum, DonorStatusEnum, SexEnum
from app.schemas.units import StockEntry
from app.schemas.wallet import WalletOut, WalletTransactionOut


class CitizenProfileOut(BaseModel):
    donor_id: uuid.UUID
    user_id: uuid.UUID
    username: str
    display_name: str | None
    name: str
    date_of_birth: date | None
    age_years: int | None
    sex: SexEnum | None
    contact_phone: str
    address: str | None
    blood_group: BloodGroupEnum | None
    status: DonorStatusEnum
    abha_reference: str | None
    abha_verified: bool
    consent_given: bool
    registered_at_facility_id: uuid.UUID | None
    registered_at_facility_name: str | None = None


class CitizenStockOut(BaseModel):
    facility_id: uuid.UUID
    facility_name: str | None
    entries: list[StockEntry]
    as_of: datetime


class PublicFacilityOut(BaseModel):
    id: uuid.UUID
    name: str
    facility_code: str
    district: str | None


class DonationHistoryItem(BaseModel):
    donation_id: uuid.UUID
    camp_id: uuid.UUID | None
    camp_name: str | None
    location: str | None
    collection_datetime: datetime
    donation_type: str
    volume_ml: int | None


class CitizenWalletOut(BaseModel):
    wallet: WalletOut
    transactions: list[WalletTransactionOut]


class PublicCampOut(BaseModel):
    id: uuid.UUID
    camp_name: str
    requested_date: date
    location: str
    expected_donors: int | None
    host_facility_id: uuid.UUID
    host_facility_name: str | None = None


class CampBookingCreateRequest(BaseModel):
    camp_id: uuid.UUID
    notes: str | None = Field(None, max_length=500)


class CampBookingOut(BaseModel):
    id: uuid.UUID
    camp_id: uuid.UUID
    camp_name: str
    requested_date: date
    location: str
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
