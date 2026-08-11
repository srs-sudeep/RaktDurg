---
id: tasks
title: Celery Tasks
---

# Celery Tasks

## Configuration

```python
# app/celery_app.py
celery = Celery(
    "rakt_durg",
    broker=settings.CELERY_BROKER_URL,   # redis://localhost:6379/1
    backend=settings.REDIS_URL,
)

celery.conf.beat_schedule = {
    "expire-components-daily": {
        "task": "app.tasks.expiry.expire_components",
        "schedule": crontab(hour=1, minute=0),  # 01:00 daily
    },
    "expire-wallet-credits-daily": {
        "task": "app.tasks.expiry.expire_wallet_credits",
        "schedule": crontab(hour=1, minute=30),  # 01:30 daily
    },
    "erakkosh-export-daily": {
        "task": "app.tasks.export.erakkosh_daily_export",
        "schedule": crontab(hour=23, minute=50),  # 23:50 daily
    },
}
```

## `expire_components` (01:00 daily)

Marks overdue components and units as expired:

```python
@celery.task
def expire_components():
    # Find components WHERE status = 'available' AND expiry_datetime < now()
    # Update status to 'expired'
    # Update parent blood_unit lifecycle_state to 'expired' (if all components expired)
    # Post LedgerReasonEnum.EXPIRY entries
    # Log to audit_logs
```

## `expire_wallet_credits` (01:30 daily)

Expires old wallet credits. Skips if wallet feature is disabled:

```python
@celery.task
def expire_wallet_credits():
    # Check wallet_enabled feature flag first
    # If disabled: log and return early
    # Find EARN transactions older than 2 years with remaining balance
    # Post EXPIRE transactions
    # Update wallet balances
```

## `erakkosh_daily_export` (23:50 daily)

Builds and exports daily summary to e-RaktKosh:

```python
@celery.task
def erakkosh_daily_export(export_date_iso: str | None = None):
    # Default to today if not specified
    # Query: donation count + available units by blood group
    # Call adapters/erakkosh.py → export_daily()
    # Dev: write to /tmp/erakkosh_exports/{date}.json
    # Prod: POST to e-RaktKosh endpoint
```

## `send_notification` (on-demand)

```python
@celery.task(bind=True, max_retries=3)
def send_notification(self, notification_id: str):
    # Load notification from DB
    # Route by channel (whatsapp / sms / in_app)
    # Mark sent or failed
    # Retry on failure (3 attempts, exponential backoff)
```

## Running Workers

```bash
# Start worker (processes tasks immediately)
celery -A app.celery_app worker --loglevel=info -c 2

# Start beat (schedules periodic tasks)
celery -A app.celery_app beat --loglevel=info

# In Docker Compose, these are separate services:
# celery-worker and celery-beat
```

## Monitoring

```bash
# View active tasks
celery -A app.celery_app inspect active

# View task history (requires Redis backend)
celery -A app.celery_app events
```
