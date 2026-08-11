"""
Blood Credit Wallet service — Phase 4.

All operations are gated by the wallet_enabled feature flag.
WalletAccount.balance has a CHECK >= 0 constraint; insufficient balance
will raise an IntegrityError which we convert to a domain error.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import FeatureFlag
from app.models.enums import WalletTxnTypeEnum
from app.models.wallet import WalletAccount, WalletFamilyLink, WalletTransaction
from app.schemas.wallet import FamilyLinkRequest, WalletCreditRequest, WalletRedeemRequest


class WalletDisabledError(Exception):
    pass


class InsufficientCreditError(Exception):
    pass


async def _assert_enabled(db: AsyncSession) -> None:
    result = await db.execute(
        select(FeatureFlag).where(FeatureFlag.name == "wallet_enabled")
    )
    flag = result.scalar_one_or_none()
    if not flag or not flag.is_enabled:
        raise WalletDisabledError("Blood Credit Wallet is not enabled")


async def get_or_create_wallet(donor_id: uuid.UUID, db: AsyncSession) -> WalletAccount:
    await _assert_enabled(db)
    result = await db.execute(
        select(WalletAccount).where(WalletAccount.donor_id == donor_id)
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = WalletAccount(donor_id=donor_id, balance=0, is_active=True)
        db.add(wallet)
        await db.flush()
    return wallet


async def credit_wallet(
    donor_id: uuid.UUID,
    request: WalletCreditRequest,
    recorded_by: uuid.UUID,
    db: AsyncSession,
) -> WalletTransaction:
    await _assert_enabled(db)
    wallet = await get_or_create_wallet(donor_id, db)

    wallet.balance += request.amount
    txn = WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTxnTypeEnum.EARN,
        amount=request.amount,
        balance_after=wallet.balance,
        reference_type=request.reference_type,
        reference_id=request.reference_id,
        expiry_date=request.expiry_date,
        recorded_by=recorded_by,
        recorded_at=datetime.now(tz=timezone.utc),
    )
    db.add(txn)
    await db.flush()
    return txn


async def redeem_wallet(
    donor_id: uuid.UUID,
    request: WalletRedeemRequest,
    recorded_by: uuid.UUID,
    db: AsyncSession,
) -> WalletTransaction:
    await _assert_enabled(db)

    # Verify family link if beneficiary differs
    if request.beneficiary_donor_id and request.beneficiary_donor_id != donor_id:
        link_result = await db.execute(
            select(WalletFamilyLink).where(
                WalletFamilyLink.primary_donor_id == donor_id,
                WalletFamilyLink.beneficiary_donor_id == request.beneficiary_donor_id,
                WalletFamilyLink.is_verified == True,
            )
        )
        if not link_result.scalar_one_or_none():
            raise ValueError("No verified family link found for beneficiary")

    wallet = await get_or_create_wallet(donor_id, db)
    if wallet.balance < request.amount:
        raise InsufficientCreditError(f"Insufficient balance: {wallet.balance} < {request.amount}")

    wallet.balance -= request.amount
    txn = WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTxnTypeEnum.REDEEM,
        amount=request.amount,
        balance_after=wallet.balance,
        reference_type=request.reference_type,
        reference_id=request.reference_id,
        beneficiary_donor_id=request.beneficiary_donor_id,
        recorded_by=recorded_by,
        recorded_at=datetime.now(tz=timezone.utc),
    )
    db.add(txn)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise InsufficientCreditError("Balance cannot go below zero")
    return txn


async def add_family_link(
    primary_donor_id: uuid.UUID,
    request: FamilyLinkRequest,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> WalletFamilyLink:
    await _assert_enabled(db)
    link = WalletFamilyLink(
        primary_donor_id=primary_donor_id,
        beneficiary_donor_id=request.beneficiary_donor_id,
        relationship=request.relationship,
        is_verified=False,
    )
    db.add(link)
    await db.flush()
    return link
