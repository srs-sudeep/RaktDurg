from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import OrgCategoryEnum


class OrganizerOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    org_name: str
    org_type: str | None
    org_category: OrgCategoryEnum | None
    contact_name: str | None
    contact_role: str | None
    contact_phone: str | None
    contact_email: str | None
    contact_address: str | None
    address: str | None
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrganizerUpdateRequest(BaseModel):
    org_name: str | None = Field(None, min_length=2, max_length=200)
    org_type: str | None = Field(None, max_length=50)
    org_category: OrgCategoryEnum | None = None
    contact_name: str | None = Field(None, max_length=200)
    contact_role: str | None = Field(None, max_length=100)
    contact_phone: str | None = Field(None, max_length=20)
    contact_email: EmailStr | None = None
    contact_address: str | None = Field(None, max_length=1000)
    address: str | None = Field(None, max_length=1000)


class OrganizerDirectoryOut(BaseModel):
    id: uuid.UUID
    category: OrgCategoryEnum
    org_name: str
    contact_role: str | None
    location: str | None
    mobile: str | None
    source_serial: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrganizerDirectoryListResponse(BaseModel):
    items: list[OrganizerDirectoryOut]
    total: int
    page: int
    page_size: int


class OrganizerListResponse(BaseModel):
    items: list[OrganizerOut]
    total: int
    page: int
    page_size: int
