"""
Donor registration and screening service.

DPDP compliance:
  - No raw Aadhaar stored; only ABHA reference (optional)
  - consent_given / consent_timestamp / consent_purpose recorded at registration
  - Donor PII access routed through audit middleware (logged automatically)
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.abha import verify_abha_reference
from app.core.eligibility import EligibilityDecision, ScreeningInput, assess_eligibility
from app.models.donor import Donor, Screening
from app.models.enums import DonorStatusEnum
from app.schemas.donors import DonorCreateRequest, ScreeningCreateRequest


async def register_donor(
    request: DonorCreateRequest,
    facility_id: uuid.UUID | None,
    created_by: uuid.UUID,
    db: AsyncSession,
) -> Donor:
    abha_verified = False
    if request.abha_reference:
        result = await verify_abha_reference(request.abha_reference)
        abha_verified = result.verified

    today = date.today()
    age = (today - request.date_of_birth).days // 365

    donor = Donor(
        name=request.name,
        date_of_birth=request.date_of_birth,
        age_years=age,
        sex=request.sex,
        contact_phone=request.contact_phone,
        address=request.address,
        blood_group=request.blood_group,
        abha_reference=request.abha_reference,
        abha_verified=abha_verified,
        status=DonorStatusEnum.ACTIVE,
        consent_given=request.consent_given,
        consent_timestamp=datetime.now(tz=timezone.utc),
        consent_purpose=request.consent_purpose,
        registered_at_facility_id=facility_id,
        created_by=created_by,
    )
    db.add(donor)
    await db.flush()
    return donor


async def screen_donor(
    request: ScreeningCreateRequest,
    screened_by: uuid.UUID,
    db: AsyncSession,
) -> tuple[Screening, EligibilityDecision]:
    # Idempotency: same sync_id returns existing record
    if request.sync_id:
        existing = await db.execute(
            select(Screening).where(Screening.sync_id == request.sync_id)
        )
        row = existing.scalar_one_or_none()
        if row:
            from app.core.eligibility import EligibilityDecision
            return row, EligibilityDecision(result=row.eligibility_result, deferral_reason=row.deferral_reason, deferral_until=row.deferral_until)

    # Find last donation date for interval check
    from app.models.donor import Donation
    last_donation = await db.execute(
        select(Donation)
        .where(Donation.donor_id == request.donor_id)
        .order_by(Donation.collection_datetime.desc())
        .limit(1)
    )
    last_row = last_donation.scalar_one_or_none()
    days_since: int | None = None
    if last_row:
        delta = datetime.now(tz=timezone.utc) - last_row.collection_datetime.replace(tzinfo=timezone.utc)
        days_since = delta.days

    donor_row = await db.get(Donor, request.donor_id)
    if not donor_row:
        raise ValueError("Donor not found")

    q = request.questionnaire
    inp = ScreeningInput(
        age_years=donor_row.age_years or 18,
        sex=donor_row.sex.value,
        weight_kg=request.vitals.weight_kg,
        hemoglobin_g_dl=request.vitals.hemoglobin_g_dl,
        bp_systolic=request.vitals.bp_systolic,
        bp_diastolic=request.vitals.bp_diastolic,
        pulse_bpm=request.vitals.pulse_bpm,
        temperature_celsius=request.vitals.temperature_celsius,
        had_recent_illness=q.had_recent_illness,
        had_recent_surgery=q.had_recent_surgery,
        is_pregnant=q.is_pregnant,
        had_tattoo_last_6m=q.had_tattoo_last_6m,
        had_sti=q.had_sti,
        is_on_medication=q.is_on_medication,
        days_since_last_donation=days_since,
    )
    decision = assess_eligibility(inp)

    vitals_dict = request.vitals.model_dump()
    questionnaire_dict = request.questionnaire.model_dump()

    screening = Screening(
        donor_id=request.donor_id,
        camp_id=request.camp_id,
        screened_by=screened_by,
        screening_datetime=request.screening_datetime,
        weight_kg=vitals_dict["weight_kg"],
        bp_systolic=vitals_dict["bp_systolic"],
        bp_diastolic=vitals_dict["bp_diastolic"],
        pulse_bpm=vitals_dict["pulse_bpm"],
        temperature_celsius=vitals_dict["temperature_celsius"],
        hemoglobin_g_dl=vitals_dict["hemoglobin_g_dl"],
        questionnaire=questionnaire_dict,
        eligibility_result=decision.result,
        deferral_reason=decision.deferral_reason,
        deferral_until=decision.deferral_until,
        captured_offline=request.captured_offline,
        device_id=request.device_id,
        sync_id=request.sync_id,
        synced_at=datetime.now(tz=timezone.utc) if request.captured_offline else None,
    )
    db.add(screening)
    await db.flush()
    return screening, decision
