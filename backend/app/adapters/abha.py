"""
ABHA (Ayushman Bharat Health Account) adapter.

In development/testing, this is a mock that always succeeds.
Production integration requires an NHA API key + OAuth2 flow.
The adapter stores only the ABHA reference number — never raw Aadhaar.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import settings


@dataclass
class ABHAVerifyResult:
    verified: bool
    abha_reference: str
    name_on_abha: str | None = None
    error: str | None = None


async def verify_abha_reference(abha_reference: str) -> ABHAVerifyResult:
    """
    Verify an ABHA reference number.
    Returns ABHAVerifyResult; in development always returns verified=True.
    """
    if settings.ENVIRONMENT in ("development", "testing"):
        return ABHAVerifyResult(
            verified=True,
            abha_reference=abha_reference,
            name_on_abha="[Mock ABHA]",
        )

    # Production: call NHA ABHA verification API
    # Replace with real implementation when NHA credentials are available
    raise NotImplementedError("ABHA production integration not yet configured")
