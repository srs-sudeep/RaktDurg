"""
Phase 2 tests: donor registration, screening eligibility, sync.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from httpx import AsyncClient

from app.core.eligibility import EligibilityDecision, ScreeningInput, assess_eligibility
from app.models.enums import EligibilityResultEnum


# ── Eligibility unit tests ────────────────────────────────────────────────────

def _make_input(**overrides) -> ScreeningInput:
    defaults = dict(
        age_years=25,
        sex="M",
        weight_kg=65.0,
        hemoglobin_g_dl=14.0,
        bp_systolic=120,
        bp_diastolic=80,
        pulse_bpm=72,
        temperature_celsius=36.8,
    )
    defaults.update(overrides)
    return ScreeningInput(**defaults)


def test_eligible_donor():
    decision = assess_eligibility(_make_input())
    assert decision.result == EligibilityResultEnum.ELIGIBLE


def test_underage_permanently_deferred():
    decision = assess_eligibility(_make_input(age_years=16))
    assert decision.result == EligibilityResultEnum.PERMANENTLY_DEFERRED


def test_overweight_minimum_is_45kg():
    decision = assess_eligibility(_make_input(weight_kg=44.9))
    assert decision.result == EligibilityResultEnum.TEMPORARILY_DEFERRED


def test_low_hb_deferred():
    decision = assess_eligibility(_make_input(hemoglobin_g_dl=10.0))
    assert decision.result == EligibilityResultEnum.TEMPORARILY_DEFERRED
    assert decision.deferral_until is not None


def test_recent_donation_deferred():
    decision = assess_eligibility(_make_input(days_since_last_donation=30))
    assert decision.result == EligibilityResultEnum.TEMPORARILY_DEFERRED
    assert "90" in (decision.deferral_reason or "")


def test_donation_after_interval_eligible():
    decision = assess_eligibility(_make_input(days_since_last_donation=91))
    assert decision.result == EligibilityResultEnum.ELIGIBLE


def test_sti_permanently_deferred():
    decision = assess_eligibility(_make_input(had_sti=True))
    assert decision.result == EligibilityResultEnum.PERMANENTLY_DEFERRED


def test_pregnancy_temporarily_deferred():
    decision = assess_eligibility(_make_input(is_pregnant=True))
    assert decision.result == EligibilityResultEnum.TEMPORARILY_DEFERRED
    assert decision.deferral_until is not None


def test_high_bp_deferred():
    decision = assess_eligibility(_make_input(bp_systolic=170))
    assert decision.result == EligibilityResultEnum.TEMPORARILY_DEFERRED


# ── Integration tests ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_donors_requires_auth(client: AsyncClient):
    resp = await client.get("/donors")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_donor_phlebotomist(client: AsyncClient, seed_users, facility):
    from tests.conftest import auth_header

    phlebotomist = next(u for u in seed_users.values() if u.role.value == "phlebotomist")
    headers = auth_header(phlebotomist)

    payload = {
        "name": "Ramesh Kumar",
        "date_of_birth": "1990-06-15",
        "sex": "M",
        "contact_phone": "9876543210",
        "address": "123 MG Road, Durg, CG 491001",
        "blood_group": "A+",
        "consent_given": True,
    }
    resp = await client.post("/donors", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Ramesh Kumar"
    assert data["blood_group"] == "A+"


@pytest.mark.asyncio
async def test_citizen_cannot_create_donor(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    citizen = next(u for u in seed_users.values() if u.role.value == "citizen_read")
    headers = auth_header(citizen)

    payload = {
        "name": "Test Donor",
        "date_of_birth": "1990-01-01",
        "sex": "M",
        "contact_phone": "9876543210",
        "address": "Test address, Durg",
        "blood_group": "B+",
        "consent_given": True,
    }
    resp = await client.post("/donors", json=payload, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_donors_pagination(client: AsyncClient, seed_users):
    from tests.conftest import auth_header

    lab = next(u for u in seed_users.values() if u.role.value == "lab_tech")
    headers = auth_header(lab)

    resp = await client.get("/donors?page=1&page_size=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5


@pytest.mark.asyncio
async def test_get_nonexistent_donor(client: AsyncClient, seed_users):
    import uuid
    from tests.conftest import auth_header

    lab = next(u for u in seed_users.values() if u.role.value == "lab_tech")
    headers = auth_header(lab)

    resp = await client.get(f"/donors/{uuid.uuid4()}", headers=headers)
    assert resp.status_code == 404
