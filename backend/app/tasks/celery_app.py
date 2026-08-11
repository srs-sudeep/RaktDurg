from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "rakt_durg",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.notifications",
        "app.tasks.expiry",
        "app.tasks.export",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    # Phase 1: mark expired components hourly
    "expire-components-hourly": {
        "task": "app.tasks.expiry.expire_components",
        "schedule": crontab(minute=0),  # top of every hour
    },
    # Phase 4 (wallet, flag-gated): expire wallet credits daily at 2am IST
    "expire-wallet-credits-daily": {
        "task": "app.tasks.expiry.expire_wallet_credits",
        "schedule": crontab(hour=2, minute=0),
    },
    # Phase 5: daily e-RaktKosh export at 1am IST
    "erakkosh-export-daily": {
        "task": "app.tasks.export.erakkosh_daily_export",
        "schedule": crontab(hour=1, minute=0),
    },
}
