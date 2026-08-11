"""Rich operational demo data — deliberate counts for verifying stock math."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    BloodGroupEnum,
    CampStatusEnum,
    ComponentStateEnum,
    ComponentTypeEnum,
    LedgerReasonEnum,
    RequisitionPriorityEnum,
    RequisitionStatusEnum,
    UnitLifecycleState,
    UnitReleaseStatus,
)
from seed.organizers_directory import DIRECTORY_ROWS

NOW = datetime.now(tz=timezone.utc)


def uid() -> uuid.UUID:
    return uuid.uuid4()


def days_ago(n: int) -> datetime:
    return NOW - timedelta(days=n)


def days_from_now(n: int) -> datetime:
    return NOW + timedelta(days=n)


# Target AVAILABLE PRBC counts by blood group (dashboard should match these).
TARGET_PRBC: dict[str, int] = {
    BloodGroupEnum.O_POS.value: 6,
    BloodGroupEnum.A_POS.value: 5,
    BloodGroupEnum.B_POS.value: 4,
    BloodGroupEnum.AB_POS.value: 2,
    BloodGroupEnum.O_NEG.value: 3,
    BloodGroupEnum.A_NEG.value: 2,
    BloodGroupEnum.B_NEG.value: 1,
    BloodGroupEnum.AB_NEG.value: 0,
}

# Extra FFP / platelets per group (AVAILABLE)
TARGET_FFP: dict[str, int] = {bg: n // 2 for bg, n in TARGET_PRBC.items()}
TARGET_PLATELETS: dict[str, int] = {bg: n // 3 for bg, n in TARGET_PRBC.items()}


async def seed_deliberate_inventory(
    db: AsyncSession,
    *,
    facility_id,
    donor_ids: list,
    staff_user_id,
) -> dict[str, int]:
    """Create units/components with known AVAILABLE counts for stock verification."""
    unit_count = 0
    component_count = 0
    balances: dict[tuple[str, str], int] = {}

    async def add_component(
        *,
        unit_id,
        bg: str,
        comp_type: str,
        vol: int,
        expiry: datetime,
        state: str,
        reason: str = LedgerReasonEnum.COLLECTION.value,
        change: int = 1,
    ) -> None:
        nonlocal component_count
        comp_id = uid()
        await db.execute(
            text("""
                INSERT INTO components (id, unit_id, type, volume_ml, blood_group, expiry_datetime,
                                        state, facility_id, created_at, updated_at)
                VALUES (:id, :uid, :type, :vol, :bg, :exp, :state, :fid, now(), now())
            """),
            {
                "id": str(comp_id),
                "uid": str(unit_id),
                "type": comp_type,
                "vol": vol,
                "bg": bg,
                "exp": expiry,
                "state": state,
                "fid": str(facility_id),
            },
        )
        component_count += 1
        key = (bg, comp_type)
        if state == ComponentStateEnum.AVAILABLE.value and expiry > NOW:
            balances[key] = balances.get(key, 0) + 1
        await db.execute(
            text("""
                INSERT INTO stock_ledger (id, facility_id, blood_group, component_type, change_qty,
                                          reason, reference_id, reference_type, balance_after,
                                          recorded_by, recorded_at)
                VALUES (:id, :fid, :bg, :ct, :chg, :reason, :ref, 'component', :bal, :by, now())
            """),
            {
                "id": str(uid()),
                "fid": str(facility_id),
                "bg": bg,
                "ct": comp_type,
                "chg": change if state == ComponentStateEnum.AVAILABLE.value else -abs(change or 1),
                "reason": reason,
                "ref": str(comp_id),
                "bal": balances.get(key, 0),
                "by": str(staff_user_id),
            },
        )

    donor_idx = 0

    async def next_donor():
        nonlocal donor_idx
        d = donor_ids[donor_idx % len(donor_ids)]
        donor_idx += 1
        return d

    async def make_unit(bg: str, lifecycle: str, release: str, expiry: datetime, collected_days: int):
        nonlocal unit_count
        donor_id = await next_donor()
        donation_date = days_ago(collected_days)
        screening_id = uid()
        await db.execute(
            text("""
                INSERT INTO screenings (id, donor_id, screened_by, screening_datetime,
                                        weight_kg, bp_systolic, bp_diastolic, pulse_bpm,
                                        temperature_celsius, hemoglobin_g_dl, questionnaire,
                                        eligibility_result, captured_offline, created_at, updated_at)
                VALUES (:id, :did, :by, :dt, 68.0, 118, 78, 74, 36.7, 13.8,
                        :questionnaire, 'eligible', false, now(), now())
            """),
            {
                "id": str(screening_id),
                "did": str(donor_id),
                "by": str(staff_user_id),
                "dt": donation_date,
                "questionnaire": '{"had_recent_illness":false,"had_recent_surgery":false}',
            },
        )
        donation_id = uid()
        await db.execute(
            text("""
                INSERT INTO donations (id, donor_id, screening_id, facility_id, collected_by,
                                       collection_datetime, donation_type, volume_ml, captured_offline, created_at)
                VALUES (:id, :did, :sid, :fid, :by, :dt, 'whole_blood', 450, false, now())
            """),
            {
                "id": str(donation_id),
                "did": str(donor_id),
                "sid": str(screening_id),
                "fid": str(facility_id),
                "by": str(staff_user_id),
                "dt": donation_date,
            },
        )
        unit_id = uid()
        unit_count += 1
        barcode = f"RDRKDURG{unit_count:06d}X"
        await db.execute(
            text("""
                INSERT INTO blood_units (id, barcode, donation_id, blood_group, facility_id,
                                         collection_datetime, expiry_datetime, release_status, lifecycle_state,
                                         created_by, created_at, updated_at)
                VALUES (:id, :barcode, :did, :bg, :fid, :cdt, :exp, :rel, :lc, :by, now(), now())
            """),
            {
                "id": str(unit_id),
                "barcode": barcode,
                "did": str(donation_id),
                "bg": bg,
                "fid": str(facility_id),
                "cdt": donation_date,
                "exp": expiry,
                "rel": release,
                "lc": lifecycle,
                "by": str(staff_user_id),
            },
        )
        return unit_id

    for bg, count in TARGET_PRBC.items():
        for i in range(count):
            near = i == 0 and count > 0
            expiry = days_from_now(2 if near else 20 + i)
            unit_id = await make_unit(
                bg,
                UnitLifecycleState.STORED.value,
                UnitReleaseStatus.RELEASED.value,
                expiry,
                collected_days=10 + i,
            )
            await add_component(
                unit_id=unit_id,
                bg=bg,
                comp_type=ComponentTypeEnum.PRBC.value,
                vol=280,
                expiry=expiry,
                state=ComponentStateEnum.AVAILABLE.value,
            )
            if i < TARGET_FFP.get(bg, 0):
                await add_component(
                    unit_id=unit_id,
                    bg=bg,
                    comp_type=ComponentTypeEnum.FFP.value,
                    vol=200,
                    expiry=days_from_now(90),
                    state=ComponentStateEnum.AVAILABLE.value,
                )
            if i < TARGET_PLATELETS.get(bg, 0):
                await add_component(
                    unit_id=unit_id,
                    bg=bg,
                    comp_type=ComponentTypeEnum.PLATELETS.value,
                    vol=50,
                    expiry=days_from_now(4),
                    state=ComponentStateEnum.AVAILABLE.value,
                )

    for bg in (BloodGroupEnum.O_POS.value, BloodGroupEnum.A_POS.value):
        unit_id = await make_unit(
            bg,
            UnitLifecycleState.RESERVED.value,
            UnitReleaseStatus.RELEASED.value,
            days_from_now(15),
            collected_days=8,
        )
        await add_component(
            unit_id=unit_id,
            bg=bg,
            comp_type=ComponentTypeEnum.PRBC.value,
            vol=280,
            expiry=days_from_now(15),
            state=ComponentStateEnum.RESERVED.value,
            reason=LedgerReasonEnum.RESERVE.value,
            change=0,
        )

    for bg, lifecycle in (
        (BloodGroupEnum.B_POS.value, UnitLifecycleState.ISSUED.value),
        (BloodGroupEnum.AB_POS.value, UnitLifecycleState.DISCARDED.value),
    ):
        unit_id = await make_unit(
            bg,
            lifecycle,
            UnitReleaseStatus.RELEASED.value
            if lifecycle == UnitLifecycleState.ISSUED.value
            else UnitReleaseStatus.REJECTED.value,
            days_from_now(12) if lifecycle == UnitLifecycleState.ISSUED.value else days_ago(1),
            collected_days=20,
        )
        state = (
            ComponentStateEnum.ISSUED.value
            if lifecycle == UnitLifecycleState.ISSUED.value
            else ComponentStateEnum.DISCARDED.value
        )
        await add_component(
            unit_id=unit_id,
            bg=bg,
            comp_type=ComponentTypeEnum.PRBC.value,
            vol=280,
            expiry=days_from_now(12),
            state=state,
            reason=LedgerReasonEnum.ISSUE.value
            if state == ComponentStateEnum.ISSUED.value
            else LedgerReasonEnum.DISCARD.value,
            change=0,
        )

    # Expired AVAILABLE row — must not count in live stock
    unit_id = await make_unit(
        BloodGroupEnum.O_NEG.value,
        UnitLifecycleState.STORED.value,
        UnitReleaseStatus.RELEASED.value,
        days_ago(1),
        collected_days=40,
    )
    await add_component(
        unit_id=unit_id,
        bg=BloodGroupEnum.O_NEG.value,
        comp_type=ComponentTypeEnum.PRBC.value,
        vol=280,
        expiry=days_ago(1),
        state=ComponentStateEnum.AVAILABLE.value,
    )

    return {
        "units": unit_count,
        "components": component_count,
        "available_prbc": sum(TARGET_PRBC.values()),
        "available_ffp": sum(TARGET_FFP.values()),
        "available_platelets": sum(TARGET_PLATELETS.values()),
    }


async def seed_camp_events(
    db: AsyncSession,
    *,
    facility_id,
    doctor_id,
    citizen_donor_id,
    extra_donor_ids: list | None = None,
) -> int:
    """Create camps across statuses using directory-backed organizer accounts."""
    org_rows = await db.execute(
        text("""
            SELECT o.id, o.org_name, u.username
            FROM organizers o
            JOIN users u ON u.id = o.user_id
            WHERE u.username LIKE 'org_%'
            ORDER BY u.username
            LIMIT 8
        """)
    )
    organizers = org_rows.all()
    if not organizers:
        return 0

    scenarios = [
        ("submitted", CampStatusEnum.SUBMITTED, days_from_now(21).date(), 40, None),
        ("under_review", CampStatusEnum.UNDER_REVIEW, days_from_now(14).date(), 60, None),
        ("approved", CampStatusEnum.APPROVED, days_from_now(7).date(), 50, doctor_id),
        ("approved_soon", CampStatusEnum.APPROVED, days_from_now(3).date(), 35, doctor_id),
        ("rejected", CampStatusEnum.REJECTED, days_from_now(30).date(), 80, doctor_id),
        ("completed", CampStatusEnum.COMPLETED, days_ago(45).date(), 55, doctor_id),
        ("completed_recent", CampStatusEnum.COMPLETED, days_ago(12).date(), 42, doctor_id),
        ("cancelled", CampStatusEnum.CANCELLED, days_ago(5).date(), 25, None),
    ]

    camp_ids: list = []
    for i, (label, status, camp_date, expected, approved_by) in enumerate(scenarios):
        org_id, org_name, _username = organizers[i % len(organizers)]
        camp_id = uid()
        approval_dt = NOW if approved_by else None
        await db.execute(
            text("""
                INSERT INTO camps (id, organizer_id, host_facility_id, camp_name, requested_date, location,
                                   expected_donors, venue_mode, alternate_dates, special_date_note,
                                   camps_per_year, notes, status, coupon_prefix, approved_by,
                                   approval_datetime, rejection_reason, created_at, updated_at)
                VALUES (:id, :oid, :fid, :name, :date, :loc, :exp, :venue, NULL, :special,
                        :cpy, :notes, :status, :prefix, :approved_by, :approval_dt, :rejection, now(), now())
            """),
            {
                "id": str(camp_id),
                "oid": str(org_id),
                "fid": str(facility_id),
                "name": f"{org_name[:40]} · {label.replace('_', ' ')}",
                "date": camp_date,
                "loc": "District Hospital Blood Bank, Durg"
                if i % 2 == 0
                else f"{org_name[:30]} campus, Durg",
                "exp": expected,
                "venue": "district_blood_bank" if i % 2 == 0 else "organizer_venue",
                "special": "World Blood Donor Day" if status == CampStatusEnum.APPROVED else None,
                "cpy": 2 + (i % 3),
                "notes": f"Demo camp ({label})",
                "status": status.value,
                "prefix": f"RD{i+1:02d}",
                "approved_by": str(approved_by) if approved_by else None,
                "approval_dt": approval_dt,
                "rejection": "Venue not feasible this month"
                if status == CampStatusEnum.REJECTED
                else None,
            },
        )
        if status == CampStatusEnum.APPROVED:
            camp_ids.append(camp_id)

    donors = [citizen_donor_id, *(extra_donor_ids or [])][:5]
    booking_statuses = ["requested", "requested", "confirmed", "rejected", "cancelled"]
    for i, donor_id in enumerate(donors):
        if not camp_ids:
            break
        camp_id = camp_ids[i % len(camp_ids)]
        st = booking_statuses[i % len(booking_statuses)]
        reviewed_at = NOW if st in ("confirmed", "rejected") else None
        await db.execute(
            text("""
                INSERT INTO camp_bookings (id, camp_id, donor_id, status, notes, review_notes,
                                           reviewed_at, created_at, updated_at)
                VALUES (:id, :camp_id, :donor_id, :status, :notes, :rnotes, :reviewed_at, now(), now())
            """),
            {
                "id": str(uid()),
                "camp_id": str(camp_id),
                "donor_id": str(donor_id),
                "status": st,
                "notes": "Demo slot request",
                "rnotes": "Confirmed by MO"
                if st == "confirmed"
                else ("Capacity full" if st == "rejected" else None),
                "reviewed_at": reviewed_at,
            },
        )

    return len(scenarios)


async def seed_requisitions_matrix(db: AsyncSession, *, facility_id, doctor_id) -> int:
    scenarios = [
        ("Ramesh Kumar", "A+", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.URGENT, RequisitionStatusEnum.PENDING, 2),
        ("Sunita Devi", "B+", ComponentTypeEnum.FFP, RequisitionPriorityEnum.ROUTINE, RequisitionStatusEnum.PENDING, 1),
        ("Anil Sahu", "O+", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.EMERGENCY, RequisitionStatusEnum.PENDING, 3),
        ("Kavita Singh", "AB+", ComponentTypeEnum.PLATELETS, RequisitionPriorityEnum.ROUTINE, RequisitionStatusEnum.PARTIALLY_RESERVED, 2),
        ("Manoj Tiwari", "B-", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.URGENT, RequisitionStatusEnum.PENDING, 1),
        ("Neha Verma", "O-", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.EMERGENCY, RequisitionStatusEnum.PENDING, 2),
        ("Suresh Yadav", "A-", ComponentTypeEnum.FFP, RequisitionPriorityEnum.ROUTINE, RequisitionStatusEnum.CANCELLED, 1),
        ("Pooja Jain", "O+", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.ROUTINE, RequisitionStatusEnum.ISSUED, 2),
    ]
    for patient_name, bg, ct, priority, req_status, units in scenarios:
        await db.execute(
            text("""
                INSERT INTO requisitions (id, facility_id, patient_name, patient_hospital_id,
                                          blood_group, component_type, units_requested, priority, status,
                                          clinical_indication, requested_by, requested_at, created_at, updated_at)
                VALUES (:id, :fid, :pname, :phid, :bg, :ct, :units, :priority, :status,
                        :indication, :by, now(), now(), now())
            """),
            {
                "id": str(uid()),
                "fid": str(facility_id),
                "pname": patient_name,
                "phid": f"DGH-{uid().hex[:4].upper()}",
                "bg": bg,
                "ct": ct.value,
                "units": units,
                "priority": priority.value,
                "status": req_status.value,
                "indication": "Demo clinical indication",
                "by": str(doctor_id),
            },
        )
    return len(scenarios)


def expected_stock_summary() -> str:
    lines = ["Expected AVAILABLE stock (excludes reserved/issued/expired):"]
    lines.append("  PRBC: " + ", ".join(f"{k}={v}" for k, v in TARGET_PRBC.items()))
    lines.append("  FFP:  " + ", ".join(f"{k}={v}" for k, v in TARGET_FFP.items() if v))
    lines.append("  PLT:  " + ", ".join(f"{k}={v}" for k, v in TARGET_PLATELETS.items() if v))
    lines.append(f"  Directory organizer accounts: {len(DIRECTORY_ROWS)} (org_<serial> / org123)")
    return "\n".join(lines)
