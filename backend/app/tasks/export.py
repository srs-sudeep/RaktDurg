"""
e-RaktKosh daily export task.
"""

import asyncio
from datetime import date, datetime, timezone

from celery.utils.log import get_task_logger

from app.tasks.celery_app import celery_app

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.export.erakkosh_daily_export", bind=True, max_retries=3)
def erakkosh_daily_export(self, export_date_iso: str | None = None):
    """Run the daily e-RaktKosh export. Defaults to yesterday."""
    try:
        return asyncio.get_event_loop().run_until_complete(
            _erakkosh_daily_export(export_date_iso)
        )
    except Exception as exc:
        logger.exception("erakkosh_daily_export failed: %s", exc)
        raise self.retry(exc=exc, countdown=300)


async def _erakkosh_daily_export(export_date_iso: str | None) -> dict:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from app.config import settings
    from app.adapters.erakkosh import build_daily_payload, export_daily

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    target = (
        date.fromisoformat(export_date_iso)
        if export_date_iso
        else date.today()
    )

    async with factory() as db:
        payload = await build_daily_payload(db)
        submission_id = await export_daily(target, payload)

    await engine.dispose()
    result = {
        "submission_id": submission_id,
        "export_date": target.isoformat(),
        "ran_at": datetime.now(tz=timezone.utc).isoformat(),
    }
    logger.info("erakkosh_daily_export: %s", result)
    return result
