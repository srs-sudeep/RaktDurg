"""
Notification adapter.

Abstracts SMS / WhatsApp / email delivery behind a single interface.
In development/testing, messages are logged only (no real sends).
Production integrations swap in the real provider (e.g., Twilio, Kaleyra).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class NotificationResult:
    success: bool
    provider_message_id: str | None = None
    error: str | None = None


async def send_sms(phone: str, message: str) -> NotificationResult:
    if settings.ENVIRONMENT in ("development", "testing"):
        logger.info("[MOCK SMS] → %s: %s", phone, message[:80])
        return NotificationResult(success=True, provider_message_id="mock-sms-001")

    # Production: replace with real SMS provider
    raise NotImplementedError("SMS provider not configured")


async def send_whatsapp(phone: str, template: str, params: dict) -> NotificationResult:
    if settings.ENVIRONMENT in ("development", "testing"):
        logger.info("[MOCK WA] → %s template=%s params=%s", phone, template, params)
        return NotificationResult(success=True, provider_message_id="mock-wa-001")

    raise NotImplementedError("WhatsApp provider not configured")


async def send_email(to_email: str, subject: str, body: str) -> NotificationResult:
    if settings.ENVIRONMENT in ("development", "testing"):
        logger.info("[MOCK EMAIL] → %s subject=%s", to_email, subject)
        return NotificationResult(success=True, provider_message_id="mock-email-001")

    raise NotImplementedError("Email provider not configured")
