"""
e-RaktKosh adapter.

Exports daily donation/unit/stock data to the national blood bank registry.
In development/testing, exports are written to a local JSON file.
Production integration uses the MoHFW API (credentials via env).
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timezone
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

_EXPORT_DIR = Path("/tmp/erakkosh_exports")


async def export_daily(export_date: date, payload: dict) -> str:
    """
    Submit the daily report.
    Returns the submission ID (mock or real).
    """
    if settings.ENVIRONMENT in ("development", "testing"):
        _EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        filename = _EXPORT_DIR / f"erakkosh_{export_date.isoformat()}.json"
        filename.write_text(json.dumps(payload, indent=2, default=str))
        submission_id = f"MOCK-{export_date.isoformat()}"
        logger.info("[e-RaktKosh MOCK] Exported to %s (id: %s)", filename, submission_id)
        return submission_id

    # Production: POST to e-RaktKosh API
    raise NotImplementedError("e-RaktKosh production integration not configured")


async def build_daily_payload(db) -> dict:
    """Build the export payload for today from the database."""
    from sqlalchemy import func, select
    from app.models.donor import Donation
    from app.models.unit import BloodUnit, Component
    from app.models.enums import ComponentStateEnum

    today = datetime.now(tz=timezone.utc).date()
    today_start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    donation_count_result = await db.execute(
        select(func.count(Donation.id)).where(Donation.collection_datetime >= today_start)
    )
    donations_today = donation_count_result.scalar_one()

    available_result = await db.execute(
        select(func.count(Component.id)).where(Component.state == ComponentStateEnum.AVAILABLE)
    )
    available_units = available_result.scalar_one()

    return {
        "report_date": today.isoformat(),
        "facility_code": "RKDURG",
        "donations_today": donations_today,
        "available_units": available_units,
        "exported_at": datetime.now(tz=timezone.utc).isoformat(),
    }
