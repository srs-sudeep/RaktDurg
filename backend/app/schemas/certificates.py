from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel


class DonationCertificateOut(BaseModel):
    id: uuid.UUID
    donation_id: uuid.UUID
    donor_id: uuid.UUID
    facility_id: uuid.UUID
    certificate_number: str
    donor_name: str
    blood_group: str | None
    donation_date: date
    volume_ml: int | None
    issued_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
