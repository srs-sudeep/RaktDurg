from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.enums import UserRoleEnum
from app.schemas.citizen import (
    CampBookingCreateRequest,
    CampBookingOut,
    CitizenProfileOut,
    CitizenStockOut,
    CitizenWalletOut,
    DonationHistoryItem,
    PublicCampOut,
    PublicFacilityOut,
)
from app.services.citizen import (
    CitizenAccessError,
    cancel_citizen_booking,
    create_camp_booking,
    get_citizen_profile,
    get_citizen_stock,
    get_citizen_wallet,
    get_public_default_facility,
    list_citizen_bookings,
    list_citizen_donations,
    list_public_camps,
)
from app.services.wallet import WalletDisabledError

router = APIRouter(prefix="/citizen", tags=["citizen"])


def _wallet_disabled() -> None:
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Blood Credit Wallet is not enabled",
    )


@router.get("/profile", response_model=CitizenProfileOut)
async def my_profile(
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_citizen_profile(actor, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/stock", response_model=CitizenStockOut)
async def my_stock(
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_citizen_stock(actor, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/donations", response_model=list[DonationHistoryItem])
async def my_donations(
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await list_citizen_donations(actor, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/wallet", response_model=CitizenWalletOut)
async def my_wallet(
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        wallet, transactions = await get_citizen_wallet(actor, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except WalletDisabledError:
        _wallet_disabled()
    await db.commit()
    return CitizenWalletOut(wallet=wallet, transactions=transactions)


@router.get("/bookings", response_model=list[CampBookingOut])
async def my_bookings(
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await list_citizen_bookings(actor, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/bookings", response_model=CampBookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    body: CampBookingCreateRequest,
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await create_camp_booking(actor, body, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    await db.commit()
    return booking


@router.post("/bookings/{booking_id}/cancel", response_model=CampBookingOut)
async def cancel_booking(
    booking_id: uuid.UUID,
    actor=Depends(require_roles(UserRoleEnum.CITIZEN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await cancel_citizen_booking(booking_id, actor, db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    await db.commit()
    return booking


public_router = APIRouter(prefix="/public", tags=["citizen"])


@public_router.get("/camps", response_model=list[PublicCampOut])
async def public_camps(db: AsyncSession = Depends(get_db)):
    return await list_public_camps(db)


@public_router.get("/facilities/default", response_model=PublicFacilityOut)
async def public_default_facility(db: AsyncSession = Depends(get_db)):
    try:
        return await get_public_default_facility(db)
    except CitizenAccessError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
