"""Barcode pre-allocation for offline camp capture."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.barcode import _luhn_check, _pad_facility
from app.database import get_db
from app.middleware.rbac import get_current_user, require_roles
from app.models.auth import User
from app.models.enums import UserRoleEnum
from app.models.facility import Facility
from app.models.stock import BarcodeAllocation, BarcodeSequence

router = APIRouter(prefix="/barcodes", tags=["barcodes"])


class PreAllocateRequest(BaseModel):
    facility_id: uuid.UUID
    count: int = Field(..., ge=1, le=500)
    camp_id: uuid.UUID | None = None


class PreAllocateResponse(BaseModel):
    allocation_id: uuid.UUID
    facility_id: uuid.UUID
    camp_id: uuid.UUID | None
    sequence_start: int
    sequence_end: int
    barcodes: list[str]
    allocated_at: datetime


class AllocationOut(BaseModel):
    id: uuid.UUID
    facility_id: uuid.UUID
    camp_id: uuid.UUID | None
    sequence_start: int
    sequence_end: int
    next_sequence: int
    fully_returned: bool
    allocated_at: datetime

    model_config = {"from_attributes": True}


def _barcode_for_seq(facility_code: str, seq: int) -> str:
    prefix = "RD" + _pad_facility(facility_code)
    payload = f"{prefix}{seq:06d}"
    return payload + _luhn_check(payload)


@router.post(
    "/pre-allocate",
    response_model=PreAllocateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Pre-allocate a contiguous barcode range for offline use",
)
async def pre_allocate(
    body: PreAllocateRequest,
    actor: User = Depends(
        require_roles(
            UserRoleEnum.SUPERADMIN,
            UserRoleEnum.DOCTOR,
            UserRoleEnum.DISTRICT_ADMIN,
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    facility = await db.get(Facility, body.facility_id)
    if facility is None or not facility.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

    stmt = (
        select(BarcodeSequence)
        .where(BarcodeSequence.facility_id == body.facility_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    seq_row = result.scalar_one_or_none()
    if seq_row is None:
        seq_row = BarcodeSequence(facility_id=body.facility_id, last_seq=0)
        db.add(seq_row)
        await db.flush()

    start = seq_row.last_seq + 1
    end = seq_row.last_seq + body.count
    seq_row.last_seq = end

    allocation = BarcodeAllocation(
        facility_id=body.facility_id,
        allocated_to=actor.id,
        camp_id=body.camp_id,
        sequence_start=start,
        sequence_end=end,
        next_sequence=start,
    )
    db.add(allocation)
    await db.commit()
    await db.refresh(allocation)

    barcodes = [_barcode_for_seq(facility.facility_code, s) for s in range(start, end + 1)]
    return PreAllocateResponse(
        allocation_id=allocation.id,
        facility_id=body.facility_id,
        camp_id=body.camp_id,
        sequence_start=start,
        sequence_end=end,
        barcodes=barcodes,
        allocated_at=allocation.allocated_at,
    )


@router.get("", response_model=list[AllocationOut], summary="List barcode allocations")
async def list_allocations(
    facility_id: uuid.UUID | None = None,
    _actor: User = Depends(
        require_roles(
            UserRoleEnum.SUPERADMIN,
            UserRoleEnum.DOCTOR,
            UserRoleEnum.DISTRICT_ADMIN,
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(BarcodeAllocation).order_by(BarcodeAllocation.allocated_at.desc())
    if facility_id is not None:
        stmt = stmt.where(BarcodeAllocation.facility_id == facility_id)
    result = await db.execute(stmt.limit(100))
    return list(result.scalars().all())


@router.post(
    "/{allocation_id}/reclaim",
    response_model=AllocationOut,
    summary="Mark unused allocation range as returned",
)
async def reclaim_allocation(
    allocation_id: uuid.UUID,
    _actor: User = Depends(
        require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.DISTRICT_ADMIN)
    ),
    db: AsyncSession = Depends(get_db),
):
    allocation = await db.get(BarcodeAllocation, allocation_id)
    if allocation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
    if allocation.fully_returned:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already reclaimed")

    allocation.fully_returned = True
    allocation.returned_at = datetime.now(tz=timezone.utc)
    await db.commit()
    await db.refresh(allocation)
    return allocation
