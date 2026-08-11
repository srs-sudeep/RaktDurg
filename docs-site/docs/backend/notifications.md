---
id: notifications
title: Notifications
---

# Notifications

## Channels

| Channel | Enum Value | Use Case |
|---------|-----------|---------|
| WhatsApp | `whatsapp` | Donor eligibility results, camp confirmation |
| SMS | `sms` | OTP, critical alerts |
| In-App | `in_app` | Dashboard notifications for staff |

:::note No Email
Email is not a supported channel. The target demographic (rural donors) has higher WhatsApp/SMS penetration.
:::

## Architecture

```
API creates Notification record (status: pending)
     ↓
Celery task: send_notification(notification_id)
     ↓
Load notification from DB
     ↓
Route by channel:
  whatsapp → adapters/notification.py → send_whatsapp()
  sms      → adapters/notification.py → send_sms()
  in_app   → mark delivered, no external call
     ↓
Update status: sent / failed
Retry up to 3 times with exponential backoff
```

## Dev Adapters

In development, all external sends are mocked:

```python
# adapters/notification.py
async def send_sms(phone: str, message: str) -> dict:
    return {"status": "mock_sent", "provider": "mock", "phone": phone}

async def send_whatsapp(phone: str, message: str) -> dict:
    return {"status": "mock_sent", "provider": "mock", "phone": phone}
```

To integrate a real provider in production, replace the function body — the interface stays the same.

## Celery Task

```python
@celery.task(bind=True, max_retries=3)
def send_notification(self, notification_id: str):
    try:
        # load + process notification
        ...
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

## Creating a Notification

```python
notification = Notification(
    donor_id=donor.id,
    channel=NotificationChannelEnum.SMS,
    subject="Screening Result",
    body=f"Dear {donor.full_name}, you are eligible to donate.",
    status="pending",
)
db.add(notification)
await db.commit()
send_notification.delay(str(notification.id))
```
