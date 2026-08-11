from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import WalletTxnTypeEnum  # EARN / REDEEM / EXPIRE / ADJUST


class WalletOut(BaseModel):
    id: uuid.UUID
    donor_id: uuid.UUID
    balance: int
    is_active: bool

    model_config = {"from_attributes": True}


class WalletCreditRequest(BaseModel):
    amount: int = Field(..., ge=1, le=10)
    reference_type: str = Field("donation", max_length=50)
    reference_id: uuid.UUID
    expiry_date: date | None = None


class WalletRedeemRequest(BaseModel):
    amount: int = Field(..., ge=1)
    beneficiary_donor_id: uuid.UUID | None = None
    reference_type: str = Field("requisition", max_length=50)
    reference_id: uuid.UUID


class WalletTransactionOut(BaseModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    type: WalletTxnTypeEnum
    amount: int
    balance_after: int
    reference_type: str | None
    reference_id: uuid.UUID | None
    beneficiary_donor_id: uuid.UUID | None
    expiry_date: date | None
    recorded_at: datetime

    model_config = {"from_attributes": True}


class FamilyLinkRequest(BaseModel):
    beneficiary_donor_id: uuid.UUID
    relationship: str = Field(..., min_length=2, max_length=50)
