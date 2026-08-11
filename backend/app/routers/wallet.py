"""
Wallet endpoints — all require wallet_enabled feature flag to be ON.
Returns 503 when flag is off.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.models.enums import UserRoleEnum
from app.models.wallet import WalletAccount, WalletTransaction
from app.schemas.wallet import (
    FamilyLinkRequest,
    WalletCreditRequest,
    WalletOut,
    WalletRedeemRequest,
    WalletTransactionOut,
)
from app.services.wallet import (
    InsufficientCreditError,
    WalletDisabledError,
    add_family_link,
    credit_wallet,
    get_or_create_wallet,
    redeem_wallet,
)

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _disabled():
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Blood Credit Wallet is not enabled",
    )


@router.get("/donors/{donor_id}", response_model=WalletOut)
async def get_wallet(
    donor_id: uuid.UUID,
    actor=Depends(require_roles(UserRoleEnum.CITIZEN, UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    try:
        wallet = await get_or_create_wallet(donor_id, db)
    except WalletDisabledError:
        _disabled()
    await db.commit()
    await db.refresh(wallet)
    return wallet


@router.post("/donors/{donor_id}/credit", response_model=WalletTransactionOut, status_code=status.HTTP_201_CREATED)
async def credit(
    donor_id: uuid.UUID,
    body: WalletCreditRequest,
    actor=Depends(require_roles(UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR, UserRoleEnum.DISTRICT_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        txn = await credit_wallet(donor_id, body, actor.id, db)
    except WalletDisabledError:
        _disabled()
    await db.commit()
    await db.refresh(txn)
    return txn


@router.post("/donors/{donor_id}/redeem", response_model=WalletTransactionOut, status_code=status.HTTP_201_CREATED)
async def redeem(
    donor_id: uuid.UUID,
    body: WalletRedeemRequest,
    actor=Depends(require_roles(UserRoleEnum.CITIZEN, UserRoleEnum.DOCTOR, UserRoleEnum.SUPERADMIN)),
    db: AsyncSession = Depends(get_db),
):
    try:
        txn = await redeem_wallet(donor_id, body, actor.id, db)
    except WalletDisabledError:
        _disabled()
    except (InsufficientCreditError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    await db.commit()
    await db.refresh(txn)
    return txn


@router.get("/donors/{donor_id}/transactions", response_model=list[WalletTransactionOut])
async def list_transactions(
    donor_id: uuid.UUID,
    _actor=Depends(require_roles(UserRoleEnum.CITIZEN, UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    try:
        wallet = await get_or_create_wallet(donor_id, db)
    except WalletDisabledError:
        _disabled()

    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.recorded_at.desc())
    )
    return result.scalars().all()


@router.post("/donors/{donor_id}/family-links", status_code=status.HTTP_201_CREATED)
async def link_family(
    donor_id: uuid.UUID,
    body: FamilyLinkRequest,
    actor=Depends(require_roles(UserRoleEnum.CITIZEN, UserRoleEnum.SUPERADMIN, UserRoleEnum.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    try:
        link = await add_family_link(donor_id, body, actor.id, db)
    except WalletDisabledError:
        _disabled()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    await db.commit()
    return {"id": str(link.id), "status": "pending_verification"}
