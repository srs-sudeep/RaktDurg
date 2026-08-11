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
        text(
            """
            DELETE FROM donation_certificates
            WHERE facility_id = :fid
               OR donation_id IN (SELECT id FROM donations WHERE facility_id = :fid)
            """
        ),
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
        text("""
            DELETE FROM organizers
            WHERE user_id = :uid
               OR user_id IN (SELECT id FROM users WHERE username LIKE 'org_%')
        """),
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
    for i in range(24):
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
            "SELECT id, user_id FROM donors WHERE registered_at_facility_id = :fid ORDER BY created_at ASC LIMIT 24"
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

    print(f"  Donors: {len(donor_ids)} (covers all blood groups)")

    # ── Organizer directory + login accounts ────────────────────────────────
    from seed.organizers_directory import (
        ORGANIZER_ACCOUNT_PASSWORD,
        seed_organizer_accounts,
        seed_organizer_directory,
    )
    from seed.demo_ops_data import (
        expected_stock_summary,
        seed_camp_events,
        seed_deliberate_inventory,
        seed_requisitions_matrix,
    )

    dir_count = await seed_organizer_directory(db)
    org_created = await seed_organizer_accounts(db)
    print(f"  Organizer directory: {dir_count} contacts")
    print(f"  Organizer accounts: +{org_created} (org_<serial> / {ORGANIZER_ACCOUNT_PASSWORD})")

    # Keep demo organizer_priya profile
    org_id = uid()
    await db.execute(
        text("""
            INSERT INTO organizers (id, user_id, org_name, org_type, org_category, contact_name,
                                    contact_role, contact_phone, contact_email, contact_address,
                                    address, is_verified, created_at, updated_at)
            VALUES (:id, :uid, :oname, :otype, :ocat, :contact, :role, :phone, :email, :caddr,
                    :addr, true, now(), now())
            ON CONFLICT (user_id) DO NOTHING
        """),
        {
            "id": str(org_id),
            "uid": str(users[UserRoleEnum.ORGANIZER.value]),
            "oname": "Lions Club Durg",
            "otype": "ngo",
            "ocat": "social_org",
            "contact": "Priya Sharma",
            "role": "अध्यक्ष",
            "phone": "9876543210",
            "email": "lionsclub.durg@example.com",
            "caddr": "Near Bus Stand, Durg",
            "addr": "Lions Bhavan, Durg",
        },
    )

    # ── Camps / bookings ─────────────────────────────────────────────────────
    camp_count = await seed_camp_events(
        db,
        facility_id=facility_id,
        doctor_id=users[UserRoleEnum.DOCTOR.value],
        citizen_donor_id=citizen_donor_id,
        extra_donor_ids=donor_ids[1:6],
    )
    print(f"  Camps: {camp_count} across statuses + bookings")

    # ── Blood units + stock (deliberate counts) ───────────────────────────────
    inv = await seed_deliberate_inventory(
        db,
        facility_id=facility_id,
        donor_ids=donor_ids,
        staff_user_id=users[UserRoleEnum.DISTRICT_ADMIN.value],
    )
    print(
        f"  Blood units: {inv['units']} | Components: {inv['components']} "
        f"| AVAILABLE PRBC={inv['available_prbc']} FFP={inv['available_ffp']} PLT={inv['available_platelets']}"
    )

    # Citizen donation id for wallet (first donation for citizen donor if any)
    citizen_donation_row = await db.execute(
        text("SELECT id FROM donations WHERE donor_id = :did ORDER BY created_at DESC LIMIT 1"),
        {"did": str(citizen_donor_id)},
    )
    citizen_donation_id = citizen_donation_row.scalar_one_or_none()

    # ── Requisitions ──────────────────────────────────────────────────────────
    req_count = await seed_requisitions_matrix(
        db,
        facility_id=facility_id,
        doctor_id=users[UserRoleEnum.DOCTOR.value],
    )
    print(f"  Requisitions: {req_count}")

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
    print(expected_stock_summary())
    print("\nLogin credentials (dev only):")
    for role, (username, password) in role_creds.items():
        print(f"  {username:<30} {password:<15}  [{role.value}]")
    print(f"  {'org_<serial>':<30} {ORGANIZER_ACCOUNT_PASSWORD:<15}  [organizer × directory]")
    print("  Examples: org_1, org_99, org_201")
    print()


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await run(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
