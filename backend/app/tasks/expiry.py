"""
Periodic expiry tasks.

expire_components: marks components and blood units expired when past expiry_datetime.
expire_wallet_credits: zeroes expired wallet transaction credits (Phase 4, wallet_enabled flag).
"""

import asyncio
from datetime import datetime, timezone

from celery.utils.log import get_task_logger

from app.tasks.celery_app import celery_app

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.expiry.expire_components", bind=True, max_retries=3)
def expire_components(self):
    """Mark available components expired when expiry_datetime has passed."""
    try:
        return asyncio.get_event_loop().run_until_complete(_expire_components())
    except Exception as exc:
        logger.exception("expire_components failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)


async def _expire_components() -> dict:
    from sqlalchemy import update
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.config import settings
    from app.models.enums import ComponentStateEnum, UnitLifecycleState
    from app.models.unit import BloodUnit, Component

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    now = datetime.now(tz=timezone.utc)

    async with factory() as db:
        # Expire available components
        comp_result = await db.execute(
            update(Component)
            .where(
                Component.state == ComponentStateEnum.AVAILABLE,
                Component.expiry_datetime <= now,
            )
            .values(state=ComponentStateEnum.EXPIRED)
            .returning(Component.id)
        )
        expired_comp_ids = comp_result.scalars().all()

        # Expire collected/tested/stored blood units
        terminal_states = {
            UnitLifecycleState.TRANSFUSED,
            UnitLifecycleState.DISCARDED,
            UnitLifecycleState.EXPIRED,
        }
        active_states = [s for s in UnitLifecycleState if s not in terminal_states]

        unit_result = await db.execute(
            update(BloodUnit)
            .where(
                BloodUnit.lifecycle_state.in_(active_states),
                BloodUnit.expiry_datetime <= now,
            )
            .values(lifecycle_state=UnitLifecycleState.EXPIRED)
            .returning(BloodUnit.id)
        )
        expired_unit_ids = unit_result.scalars().all()

        await db.commit()

    await engine.dispose()

    summary = {
        "components_expired": len(expired_comp_ids),
        "units_expired": len(expired_unit_ids),
        "ran_at": now.isoformat(),
    }
    logger.info("expire_components: %s", summary)
    return summary


@celery_app.task(name="app.tasks.expiry.expire_wallet_credits", bind=True, max_retries=3)
def expire_wallet_credits(self):
    """Expire wallet credits that have passed their expiry_date. Gated by wallet_enabled flag."""
    try:
        return asyncio.get_event_loop().run_until_complete(_expire_wallet_credits())
    except Exception as exc:
        logger.exception("expire_wallet_credits failed: %s", exc)
        raise self.retry(exc=exc, countdown=120)


async def _expire_wallet_credits() -> dict:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy import select, update
    from app.config import settings
    from app.models.audit import FeatureFlag

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as db:
        flag_row = await db.execute(
            select(FeatureFlag).where(FeatureFlag.name == "wallet_enabled")
        )
        flag = flag_row.scalar_one_or_none()
        if not flag or not flag.is_enabled:
            await engine.dispose()
            return {"skipped": True, "reason": "wallet_enabled flag is off"}

        from app.models.wallet import WalletTransaction
        from app.models.enums import WalletTxnTypeEnum

        now = datetime.now(tz=timezone.utc)
        result = await db.execute(
            update(WalletTransaction)
            .where(
                WalletTransaction.expiry_date <= now.date(),
                WalletTransaction.type == WalletTxnTypeEnum.EARN,
            )
            .values(expiry_date=now.date())  # mark as used-up by setting to today
            .returning(WalletTransaction.id)
        )
        expired = result.scalars().all()
        await db.commit()

    await engine.dispose()
    summary = {"wallet_credits_expired": len(expired), "ran_at": datetime.now(tz=timezone.utc).isoformat()}
    logger.info("expire_wallet_credits: %s", summary)
    return summary
