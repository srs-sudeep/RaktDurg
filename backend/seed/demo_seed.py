"""
Comprehensive demo seed for RAKT Durg.

Creates a realistic blood bank scenario:
  - 1 facility  (RKDURG)
  - 8 users     (one per role)
  - 15 donors   (varied blood groups, genders, ages)
  - 2 camps     (one approved, one completed)
  - 30 blood units (various lifecycle states)
  - Components generated from tested units
  - Stock ledger entries
  - 5 requisitions (pending / fulfilled)
  - Notifications

All data is synthetic.  No real PII.
Run inside the container: python -m seed.demo_seed
"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from faker import Faker
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.enums import (
    BloodGroupEnum,
    CampStatusEnum,
    ComponentStateEnum,
    ComponentTypeEnum,
    DonorStatusEnum,
    EligibilityResultEnum,
    LedgerReasonEnum,
    RequisitionPriorityEnum,
    RequisitionStatusEnum,
    SexEnum,
    UnitLifecycleState,
    UnitReleaseStatus,
    UserRoleEnum,
)

fake = Faker("en_IN")
NOW = datetime.now(tz=timezone.utc)


# ── helpers ───────────────────────────────────────────────────────────────────

def uid() -> uuid.UUID:
    return uuid.uuid4()


def days_ago(n: int) -> datetime:
    return NOW - timedelta(days=n)


def days_from_now(n: int) -> datetime:
    return NOW + timedelta(days=n)


async def run(db: AsyncSession) -> None:
    print("=== RAKT Durg Demo Seed ===")

    # ── Facility ──────────────────────────────────────────────────────────────
    facility_id = uid()
    await db.execute(
        text("""
            INSERT INTO facilities (id, name, facility_code, type, address, district, state, phone, is_active,
                                    created_at, updated_at)
            VALUES (:id, :name, :code, :ftype, :addr, :dist, :state, :phone, true, now(), now())
            ON CONFLICT (facility_code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """),
        {
            "id": str(facility_id),
            "name": "Durg District Hospital Blood Bank",
            "code": "RKDURG",
            "ftype": "blood_bank",
            "addr": "MG Road, Durg, Chhattisgarh 491001",
            "dist": "Durg",
            "state": "Chhattisgarh",
            "phone": "07882-220101",
        },
    )
    result = await db.execute(text("SELECT id FROM facilities WHERE facility_code = 'RKDURG'"))
    facility_id = result.scalar_one()
    print(f"  Facility: RKDURG ({facility_id})")

    # ── Barcode sequence ──────────────────────────────────────────────────────
    await db.execute(
        text("""
            INSERT INTO barcode_sequences (facility_id, last_seq)
            VALUES (:fid, 100)
            ON CONFLICT (facility_id) DO UPDATE SET last_seq = GREATEST(barcode_sequences.last_seq, 100)
        """),
        {"fid": str(facility_id)},
    )

    # ── Users ─────────────────────────────────────────────────────────────────
    users: dict[str, uuid.UUID] = {}
    role_creds = {
        UserRoleEnum.SUPERADMIN: ("superadmin", "super123"),
        UserRoleEnum.DISTRICT_ADMIN: ("district_admin", "district123"),
        UserRoleEnum.DOCTOR: ("dr_meena", "meena123"),
        UserRoleEnum.ORGANIZER: ("organizer_priya", "priya123"),
        UserRoleEnum.CITIZEN: ("citizen_ajay", "ajay123"),
    }

    from app.services.auth import hash_password

    for role, (username, password) in role_creds.items():
        user_id = uid()
        hashed = hash_password(password)
        await db.execute(
            text("""
                INSERT INTO users (id, facility_id, role, username, email, phone, hashed_password,
                                   display_name, is_active, created_at, updated_at)
                VALUES (:id, :fid, :role, :username, :email, :phone, :hashed,
                        :display, true, now(), now())
                ON CONFLICT (username) DO NOTHING
            """),
            {
                "id": str(user_id),
                "fid": str(facility_id) if role not in (UserRoleEnum.ORGANIZER, UserRoleEnum.CITIZEN) else None,
                "role": role.value,
                "username": username,
                "email": f"{username}@rakt.local",
                "phone": fake.phone_number()[:20],
                "hashed": hashed,
                "display": username.replace("_", " ").title(),
            },
        )
        result = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username})
        users[role.value] = result.scalar_one()

    print(f"  Users: {list(role_creds.keys())}")

    # ── Clean prior demo transactional data so reseeding is repeatable ────────
    await db.execute(
        text(
            """
            DELETE FROM camp_bookings
            WHERE camp_id IN (SELECT id FROM camps WHERE host_facility_id = :fid)
               OR donor_id IN (SELECT id FROM donors WHERE registered_at_facility_id = :fid)
            """
        ),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text(
            """
            DELETE FROM wallet_transactions
            WHERE wallet_id IN (
                SELECT id FROM wallet_accounts
                WHERE donor_id IN (SELECT id FROM donors WHERE registered_at_facility_id = :fid)
            )
            """
        ),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text(
            """
            DELETE FROM wallet_accounts
            WHERE donor_id IN (SELECT id FROM donors WHERE registered_at_facility_id = :fid)
            """
        ),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM stock_ledger WHERE facility_id = :fid"),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM components WHERE facility_id = :fid"),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM blood_units WHERE facility_id = :fid"),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM donations WHERE facility_id = :fid"),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text(
            """
            DELETE FROM screenings
            WHERE donor_id IN (SELECT id FROM donors WHERE registered_at_facility_id = :fid)
            """
        ),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM requisitions WHERE facility_id = :fid"),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM camps WHERE host_facility_id = :fid"),
        {"fid": str(facility_id)},
    )
    await db.execute(
        text("DELETE FROM organizers WHERE user_id = :uid"),
        {"uid": str(users[UserRoleEnum.ORGANIZER.value])},
    )
    await db.execute(
        text("DELETE FROM donors WHERE registered_at_facility_id = :fid"),
        {"fid": str(facility_id)},
    )

    # ── Alert thresholds ──────────────────────────────────────────────────────
    for bg in BloodGroupEnum:
        for ct in ComponentTypeEnum:
            await db.execute(
                text("""
                    INSERT INTO alert_thresholds (id, facility_id, blood_group, component_type, low_stock_qty, near_expiry_days,
                                                  created_at, updated_at)
                    VALUES (:id, :fid, :bg, :ct, 2, 3, now(), now())
                    ON CONFLICT (facility_id, blood_group, component_type) DO NOTHING
                """),
                {
                    "id": str(uid()),
                    "fid": str(facility_id),
                    "bg": bg.value,
                    "ct": ct.value,
                },
            )

    # ── Donors ────────────────────────────────────────────────────────────────
    blood_groups = list(BloodGroupEnum)
    donor_ids: list[uuid.UUID] = []
    citizen_user_id = users[UserRoleEnum.CITIZEN.value]
    for i in range(15):
        donor_id = uid()
        dob = fake.date_of_birth(minimum_age=18, maximum_age=55)
        age = (NOW.date() - dob).days // 365
        sex = random.choice(list(SexEnum))
        bg = blood_groups[i % len(blood_groups)]
        is_citizen_donor = i == 0
        await db.execute(
            text("""
                INSERT INTO donors (id, name, date_of_birth, age_years, sex, contact_phone, address,
                                    blood_group, status, consent_given, consent_timestamp, consent_purpose,
                                    registered_at_facility_id, user_id, created_by, created_at, updated_at)
                VALUES (:id, :name, :dob, :age, :sex, :phone, :addr,
                        :bg, :status, true, now(), 'blood_donation_registration',
                        :fid, :user_id, :created_by, now(), now())
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(donor_id),
                "name": "Ajay Citizen" if is_citizen_donor else fake.name(),
                "dob": dob,
                "age": age,
                "sex": SexEnum.MALE.value if is_citizen_donor else sex.value,
                "phone": "9876543210" if is_citizen_donor else fake.phone_number()[:20],
                "addr": fake.address()[:200],
                "bg": BloodGroupEnum.O_POS.value if is_citizen_donor else bg.value,
                "status": DonorStatusEnum.ACTIVE.value,
                "fid": str(facility_id),
                "user_id": str(citizen_user_id) if is_citizen_donor else None,
                "created_by": str(users[UserRoleEnum.DISTRICT_ADMIN.value]),
            },
        )
        donor_ids.append(donor_id)

    donor_rows = await db.execute(
        text(
            "SELECT id, user_id FROM donors WHERE registered_at_facility_id = :fid ORDER BY created_at ASC LIMIT 15"
        ),
        {"fid": str(facility_id)},
    )
    donor_ids = []
    citizen_donor_id = None
    for donor_id, user_id in donor_rows.all():
        donor_ids.append(donor_id)
        if user_id == citizen_user_id:
            citizen_donor_id = donor_id
    if citizen_donor_id is None:
        raise RuntimeError("Citizen-linked donor was not found after donor seeding")

    print(f"  Donors: {len(donor_ids)}")

    # ── Camps ─────────────────────────────────────────────────────────────────
    organizer_id_row = await db.execute(
        text("SELECT id FROM users WHERE role = 'organizer' LIMIT 1")
    )
    organizer_user_id = organizer_id_row.scalar_one()

    org_id = uid()
    await db.execute(
        text("""
            INSERT INTO organizers (id, user_id, org_name, org_type, contact_name, contact_phone,
                                    contact_email, is_verified, created_at, updated_at)
            VALUES (:id, :uid, :oname, :otype, :contact, :phone, :email, true, now(), now())
            ON CONFLICT (user_id) DO NOTHING
        """),
        {
            "id": str(org_id),
            "uid": str(organizer_user_id),
            "oname": "Lions Club Durg",
            "otype": "ngo",
            "contact": "Priya Sharma",
            "phone": "9876543210",
            "email": "lionsclub.durg@example.com",
        },
    )
    organizer_result = await db.execute(
        text("SELECT id FROM organizers WHERE user_id = :uid"), {"uid": str(organizer_user_id)}
    )
    organizer_id = organizer_result.scalar_one()

    camp_approved_id = uid()
    camp_completed_id = uid()
    mo_id = users[UserRoleEnum.DOCTOR.value]

    for camp_id, camp_name, status, camp_date, expected in [
        (camp_approved_id, "Lions Club Blood Drive", CampStatusEnum.APPROVED, days_from_now(7).date(), 50),
        (camp_completed_id, "Rotary Club Blood Camp", CampStatusEnum.COMPLETED, days_ago(30).date(), 40),  # noqa: E501
    ]:
        await db.execute(
            text("""
                INSERT INTO camps (id, organizer_id, host_facility_id, camp_name, requested_date, location,
                                   expected_donors, status, coupon_prefix, approved_by, approval_datetime,
                                   created_at, updated_at)
                VALUES (:id, :oid, :fid, :name, :date, :loc, :exp, :status,
                        :prefix, :approved_by, now(), now(), now())
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(camp_id),
                "oid": str(organizer_id),
                "fid": str(facility_id),
                "name": camp_name,
                "date": camp_date,
                "loc": f"{fake.street_name()}, Durg",
                "exp": expected,
                "status": status.value,
                "prefix": f"RD{str(camp_id)[:4].upper()}",
                "approved_by": str(mo_id),
            },
        )

    approved_camp_result = await db.execute(
        text(
            "SELECT id FROM camps WHERE organizer_id = :oid AND camp_name = :name AND status = :status LIMIT 1"
        ),
        {
            "oid": str(organizer_id),
            "name": "Lions Club Blood Drive",
            "status": CampStatusEnum.APPROVED.value,
        },
    )
    camp_approved_id = approved_camp_result.scalar_one()

    print("  Camps: approved + completed")

    # ── Camp booking (citizen demo) ───────────────────────────────────────────
    booking_id = uid()
    await db.execute(
        text("""
            INSERT INTO camp_bookings (id, camp_id, donor_id, status, notes, created_at, updated_at)
            VALUES (:id, :camp_id, :donor_id, 'requested', :notes, now(), now())
            ON CONFLICT DO NOTHING
        """),
        {
            "id": str(booking_id),
            "camp_id": str(camp_approved_id),
            "donor_id": str(citizen_donor_id),
            "notes": "Demo booking — pending staff review",
        },
    )
    print("  Camp booking: 1 requested (citizen)")

    # ── Blood units + donations + screenings ──────────────────────────────────
    unit_ids: list[uuid.UUID] = []
    component_ids: list[uuid.UUID] = []
    citizen_donation_id: uuid.UUID | None = None

    for i, donor_id in enumerate(donor_ids[:12]):
        donation_date = days_ago(random.randint(5, 60))

        # Screening (required before donation)
        screening_id = uid()
        await db.execute(
            text("""
                INSERT INTO screenings (id, donor_id, screened_by, screening_datetime,
                                        weight_kg, bp_systolic, bp_diastolic, pulse_bpm,
                                        temperature_celsius, hemoglobin_g_dl, questionnaire,
                                        eligibility_result, captured_offline, created_at, updated_at)
                VALUES (:id, :did, :by, :dt,
                        65.0, 120, 80, 72, 36.8, 14.0,
                        :questionnaire,
                        'eligible', false, now(), now())
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(screening_id),
                "did": str(donor_id),
                "by": str(users[UserRoleEnum.DISTRICT_ADMIN.value]),
                "dt": donation_date,
                "questionnaire": '{"had_recent_illness":false,"had_recent_surgery":false}',
            },
        )

        # Donation
        donation_id = uid()
        await db.execute(
            text("""
                INSERT INTO donations (id, donor_id, screening_id, facility_id, collected_by,
                                       collection_datetime, donation_type, volume_ml, captured_offline,
                                       created_at)
                VALUES (:id, :did, :sid, :fid, :by, :dt, 'whole_blood', :vol, false, now())
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(donation_id),
                "did": str(donor_id),
                "sid": str(screening_id),
                "fid": str(facility_id),
                "by": str(users[UserRoleEnum.DISTRICT_ADMIN.value]),
                "dt": donation_date,
                "vol": random.randint(350, 450),
            },
        )
        if donor_id == citizen_donor_id:
            citizen_donation_id = donation_id

        # Blood unit
        unit_id = uid()
        barcode = f"RDRKDURG{i+1:06d}X"
        bg_result = await db.execute(text("SELECT blood_group FROM donors WHERE id = :id"), {"id": str(donor_id)})
        bg = bg_result.scalar_one()

        # Alternate between lifecycle states to create realistic inventory
        if i < 4:
            lifecycle = UnitLifecycleState.STORED
            release_status = UnitReleaseStatus.RELEASED
            expiry = days_from_now(random.randint(10, 35))
        elif i < 8:
            lifecycle = UnitLifecycleState.SEPARATED
            release_status = UnitReleaseStatus.RELEASED
            expiry = days_from_now(random.randint(5, 30))
        elif i < 10:
            lifecycle = UnitLifecycleState.ISSUED
            release_status = UnitReleaseStatus.RELEASED
            expiry = days_from_now(random.randint(15, 30))
        else:
            lifecycle = UnitLifecycleState.DISCARDED
            release_status = UnitReleaseStatus.REJECTED
            expiry = days_ago(2)

        await db.execute(
            text("""
                INSERT INTO blood_units (id, barcode, donation_id, blood_group, facility_id,
                                         collection_datetime, expiry_datetime, release_status, lifecycle_state,
                                         created_by, created_at, updated_at)
                VALUES (:id, :barcode, :did, :bg, :fid, :cdt, :exp, :rel, :lc, :by, now(), now())
                ON CONFLICT (barcode) DO NOTHING
            """),
            {
                "id": str(unit_id),
                "barcode": barcode,
                "did": str(donation_id),
                "bg": bg,
                "fid": str(facility_id),
                "cdt": donation_date,
                "exp": expiry,
                "rel": release_status.value,
                "lc": lifecycle.value,
                "by": str(users[UserRoleEnum.DISTRICT_ADMIN.value]),
            },
        )
        unit_ids.append(unit_id)

        # Components for stored/separated units
        if lifecycle in (UnitLifecycleState.STORED, UnitLifecycleState.SEPARATED):
            for comp_type, vol in [
                (ComponentTypeEnum.PRBC, 280),
                (ComponentTypeEnum.FFP, 200),
                (ComponentTypeEnum.PLATELETS, 50),
            ]:
                comp_id = uid()
                comp_state = ComponentStateEnum.AVAILABLE
                await db.execute(
                    text("""
                        INSERT INTO components (id, unit_id, type, volume_ml, blood_group, expiry_datetime,
                                                state, facility_id, created_at, updated_at)
                        VALUES (:id, :uid, :type, :vol, :bg, :exp, :state, :fid, now(), now())
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "id": str(comp_id),
                        "uid": str(unit_id),
                        "type": comp_type.value,
                        "vol": vol,
                        "bg": bg,
                        "exp": expiry,
                        "state": comp_state.value,
                        "fid": str(facility_id),
                    },
                )
                component_ids.append(comp_id)

                # Stock ledger entry
                await db.execute(
                    text("""
                        INSERT INTO stock_ledger (id, facility_id, blood_group, component_type, change_qty,
                                                  reason, reference_id, reference_type, balance_after,
                                                  recorded_by, recorded_at)
                        VALUES (:id, :fid, :bg, :ct, 1, :reason, :ref, 'component', 1,
                                :by, now())
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "id": str(uid()),
                        "fid": str(facility_id),
                        "bg": bg,
                        "ct": comp_type.value,
                        "reason": LedgerReasonEnum.COLLECTION.value,
                        "ref": str(comp_id),
                        "by": str(users[UserRoleEnum.DISTRICT_ADMIN.value]),
                    },
                )

    print(f"  Blood units: {len(unit_ids)} | Components: {len(component_ids)}")

    # ── Requisitions ──────────────────────────────────────────────────────────
    req_scenarios = [
        ("Ramesh Kumar", "A+", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.URGENT, RequisitionStatusEnum.PENDING),
        ("Sunita Devi", "B+", ComponentTypeEnum.FFP, RequisitionPriorityEnum.ROUTINE, RequisitionStatusEnum.PENDING),
        ("Anil Sahu", "O+", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.EMERGENCY, RequisitionStatusEnum.ISSUED),
        ("Kavita Singh", "AB+", ComponentTypeEnum.PLATELETS, RequisitionPriorityEnum.ROUTINE, RequisitionStatusEnum.ISSUED),
        ("Manoj Tiwari", "B-", ComponentTypeEnum.PRBC, RequisitionPriorityEnum.URGENT, RequisitionStatusEnum.PENDING),
    ]
    for patient_name, bg, ct, priority, req_status in req_scenarios:
        req_id = uid()
        await db.execute(
            text("""
                INSERT INTO requisitions (id, facility_id, patient_name, patient_hospital_id,
                                          blood_group, component_type, units_requested, priority, status,
                                          clinical_indication, requested_by, requested_at, created_at, updated_at)
                VALUES (:id, :fid, :pname, :phid, :bg, :ct, 2, :priority, :status,
                        :indication, :by, now(), now(), now())
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(req_id),
                "fid": str(facility_id),
                "pname": patient_name,
                "phid": f"DGH-{fake.numerify('####')}",
                "bg": bg,
                "ct": ct.value,
                "priority": priority.value,
                "status": req_status.value,
                "indication": random.choice(["Surgical blood loss", "Severe anaemia", "Road traffic accident", "Haematological disorder"]),
                "by": str(users[UserRoleEnum.DOCTOR.value]),
            },
        )

    print("  Requisitions: 5")

    # ── Feature flags ─────────────────────────────────────────────────────────
    await db.execute(
        text("""
            INSERT INTO feature_flags (name, is_enabled, description, updated_at)
            VALUES ('wallet_enabled', true, 'Blood Credit Wallet — enabled in demo/dev', now())
            ON CONFLICT (name) DO UPDATE SET is_enabled = true, updated_at = now()
        """)
    )

    # ── Citizen wallet (demo credit) ──────────────────────────────────────────
    wallet_id = uid()
    await db.execute(
        text("""
            INSERT INTO wallet_accounts (id, donor_id, balance, is_active, created_at, updated_at)
            VALUES (:id, :donor_id, 2, true, now(), now())
            ON CONFLICT (donor_id) DO UPDATE SET balance = 2, updated_at = now()
        """),
        {"id": str(wallet_id), "donor_id": str(citizen_donor_id)},
    )
    wallet_row = await db.execute(
        text("SELECT id FROM wallet_accounts WHERE donor_id = :did"),
        {"did": str(citizen_donor_id)},
    )
    wallet_id = wallet_row.scalar_one()
    if citizen_donation_id:
        await db.execute(
            text("""
                INSERT INTO wallet_transactions (id, wallet_id, type, amount,
                                                 balance_after, reference_type, reference_id,
                                                 notes, recorded_by, recorded_at)
                VALUES (:id, :wid, 'earn', 2, 2, 'donation', :ref, 'Demo blood credit', :by, now())
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(uid()),
                "wid": str(wallet_id),
                "ref": str(citizen_donation_id),
                "by": str(users[UserRoleEnum.DISTRICT_ADMIN.value]),
            },
        )
    print("  Wallet: enabled + citizen demo balance")

    await db.commit()

    print("\n=== Demo seed complete ===")
    print("\nLogin credentials (dev only):")
    for role, (username, password) in role_creds.items():
        print(f"  {username:<30} {password:<15}  [{role.value}]")
    print()


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await run(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
