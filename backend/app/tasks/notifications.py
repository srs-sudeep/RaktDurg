"""
Notification delivery tasks.
Reads pending/failed Notification rows and retries via the adapter.
"""

import asyncio
from datetime import datetime, timezone

from celery.utils.log import get_task_logger

from app.tasks.celery_app import celery_app

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.notifications.send_notification", bind=True, max_retries=5)
def send_notification(self, notification_id: str):
    """Deliver a single notification by ID."""
    try:
        return asyncio.get_event_loop().run_until_complete(_send_notification(notification_id))
    except Exception as exc:
        logger.exception("send_notification %s failed: %s", notification_id, exc)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 60)


async def _send_notification(notification_id: str) -> dict:
    import uuid
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from app.config import settings
    from app.models.notification import Notification
    from app.models.enums import NotificationChannelEnum, NotificationStatusEnum
    from app.adapters.notification import send_sms, send_email, send_whatsapp

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as db:
        notif = await db.get(Notification, uuid.UUID(notification_id))
        if not notif:
            return {"error": "notification not found"}

        payload = notif.payload or {}
        result = None

        if notif.channel == NotificationChannelEnum.SMS:
            phone = payload.get("phone", "")
            message = payload.get("message", "")
            result = await send_sms(phone, message)
        elif notif.channel == NotificationChannelEnum.WHATSAPP:
            phone = payload.get("phone", "")
            result = await send_whatsapp(phone, notif.template_name, payload)
        # IN_APP notifications are delivered on read; no push needed here

        if result and result.success:
            notif.status = NotificationStatusEnum.SENT
            notif.sent_at = datetime.now(tz=timezone.utc)
            notif.provider_message_id = result.provider_message_id
        else:
            notif.status = NotificationStatusEnum.FAILED
            notif.error_detail = result.error if result else "Unknown error"

        await db.commit()

    await engine.dispose()
    return {"notification_id": notification_id, "success": result.success if result else False}
