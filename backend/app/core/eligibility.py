"""
Donor eligibility rules engine.

Rules are applied in priority order — first disqualifying rule wins.
Returns (EligibilityResult, deferral_reason, deferral_until).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from app.models.enums import EligibilityResultEnum


@dataclass
class EligibilityDecision:
    result: EligibilityResultEnum
    deferral_reason: str | None = None
    deferral_until: date | None = None


@dataclass
class ScreeningInput:
    # Demographics
    age_years: int
    sex: str  # M / F / O
    weight_kg: float
    # Vitals
    hemoglobin_g_dl: float
    bp_systolic: int
    bp_diastolic: int
    pulse_bpm: int
    temperature_celsius: float
    # Questionnaire answers
    had_recent_illness: bool = False          # illness in last 2 weeks
    had_recent_surgery: bool = False          # surgery in last 6 months
    is_pregnant: bool = False                 # pregnancy / recent delivery
    had_tattoo_last_6m: bool = False          # tattoo or piercing in last 6 months
    had_sti: bool = False                     # STI history
    is_on_medication: bool = False            # on any long-term medication
    # Donation history (supplied by service layer)
    days_since_last_donation: int | None = None


_MIN_AGE = 18
_MAX_AGE = 65
_MIN_WEIGHT_KG = 45.0
_MIN_HB_GDL = 12.5          # applies to all; India NBTC standard
_MIN_INTERVAL_DAYS = 90     # 3 months between donations
_MAX_BP_SYSTOLIC = 160
_MIN_BP_SYSTOLIC = 90
_MAX_BP_DIASTOLIC = 100
_MIN_BP_DIASTOLIC = 50
_MIN_PULSE = 50
_MAX_PULSE = 100
_MAX_TEMP = 37.5


def _temp_defer(reason: str, days: int, today: date | None = None) -> EligibilityDecision:
    today = today or date.today()
    return EligibilityDecision(
        result=EligibilityResultEnum.TEMPORARILY_DEFERRED,
        deferral_reason=reason,
        deferral_until=today + timedelta(days=days),
    )


def _perm_defer(reason: str) -> EligibilityDecision:
    return EligibilityDecision(
        result=EligibilityResultEnum.PERMANENTLY_DEFERRED,
        deferral_reason=reason,
    )


def assess_eligibility(inp: ScreeningInput, today: date | None = None) -> EligibilityDecision:
    today = today or date.today()

    if inp.age_years < _MIN_AGE:
        return _perm_defer(f"Age {inp.age_years} is below minimum of {_MIN_AGE}")
    if inp.age_years > _MAX_AGE:
        return _perm_defer(f"Age {inp.age_years} exceeds maximum of {_MAX_AGE}")

    if inp.weight_kg < _MIN_WEIGHT_KG:
        return _temp_defer(f"Weight {inp.weight_kg:.1f} kg below minimum 45 kg", 0)

    if inp.hemoglobin_g_dl < _MIN_HB_GDL:
        return _temp_defer(f"Haemoglobin {inp.hemoglobin_g_dl:.1f} g/dL below 12.5", 90)

    if inp.bp_systolic > _MAX_BP_SYSTOLIC or inp.bp_systolic < _MIN_BP_SYSTOLIC:
        return _temp_defer(f"Systolic BP {inp.bp_systolic} out of range (90–160)", 7)
    if inp.bp_diastolic > _MAX_BP_DIASTOLIC or inp.bp_diastolic < _MIN_BP_DIASTOLIC:
        return _temp_defer(f"Diastolic BP {inp.bp_diastolic} out of range (50–100)", 7)

    if not (_MIN_PULSE <= inp.pulse_bpm <= _MAX_PULSE):
        return _temp_defer(f"Pulse {inp.pulse_bpm} out of range (50–100)", 7)

    if inp.temperature_celsius > _MAX_TEMP:
        return _temp_defer(f"Temperature {inp.temperature_celsius:.1f} °C above 37.5", 14)

    if inp.is_pregnant:
        return _temp_defer("Pregnancy or recent delivery/breastfeeding", 365)

    if inp.had_recent_illness:
        return _temp_defer("Recent illness in last 2 weeks", 14)

    if inp.had_recent_surgery:
        return _temp_defer("Surgery or dental procedure in last 6 months", 180)

    if inp.had_tattoo_last_6m:
        return _temp_defer("Tattoo or body piercing in last 6 months", 180)

    if inp.had_sti:
        return _perm_defer("History of sexually transmitted infection (STI)")

    if inp.days_since_last_donation is not None and inp.days_since_last_donation < _MIN_INTERVAL_DAYS:
        days_left = _MIN_INTERVAL_DAYS - inp.days_since_last_donation
        return _temp_defer(
            f"Last donation was {inp.days_since_last_donation} days ago (minimum 90 days required)",
            days_left,
            today,
        )

    return EligibilityDecision(result=EligibilityResultEnum.ELIGIBLE)
