"""Initial schema — all tables, enums, indexes, audit rules, feature flag seed.

Revision ID: 0001
Revises:
Create Date: 2026-08-11
"""

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Enum types ─────────────────────────────────────────────────────────
    op.execute("""
        CREATE TYPE blood_group_enum AS ENUM
          ('A+','A-','B+','B-','AB+','AB-','O+','O-')
    """)
    op.execute("""
        CREATE TYPE sex_enum AS ENUM ('M','F','O')
    """)
    op.execute("""
        CREATE TYPE component_type_enum AS ENUM
          ('whole_blood','prbc','platelets','ffp','cryo','granulocytes')
    """)
    op.execute("""
        CREATE TYPE unit_lifecycle_state AS ENUM
          ('collected','tested','separated','stored','reserved',
           'issued','transfused','discarded','expired')
    """)
    op.execute("""
        CREATE TYPE unit_release_status AS ENUM
          ('pending','released','rejected','quarantine')
    """)
    op.execute("""
        CREATE TYPE component_state_enum AS ENUM
          ('available','reserved','issued','transfused','discarded','expired')
    """)
    op.execute("""
        CREATE TYPE test_result_enum AS ENUM
          ('reactive','non_reactive','indeterminate')
    """)
    op.execute("""
        CREATE TYPE eligibility_result_enum AS ENUM
          ('eligible','temporarily_deferred','permanently_deferred')
    """)
    op.execute("""
        CREATE TYPE camp_status_enum AS ENUM
          ('draft','submitted','under_review','approved','rejected','cancelled','completed')
    """)
    op.execute("""
        CREATE TYPE org_category_enum AS ENUM
          ('community_society','social_org','police_paramilitary','govt_union',
           'educational','industrial','political','departmental_officer','other')
    """)
    op.execute("""
        CREATE TYPE venue_mode_enum AS ENUM
          ('district_blood_bank','organizer_venue')
    """)
    op.execute("""
        CREATE TYPE requisition_status_enum AS ENUM
          ('pending','partially_reserved','fully_reserved',
           'partially_issued','issued','cancelled')
    """)
    op.execute("""
        CREATE TYPE requisition_priority_enum AS ENUM
          ('routine','urgent','emergency')
    """)
    op.execute("""
        CREATE TYPE ledger_reason_enum AS ENUM
          ('collection','reserve','unreserve','issue','transfused',
           'discard','expiry','transfer_in','transfer_out','adjustment')
    """)
    op.execute("""
        CREATE TYPE wallet_txn_type_enum AS ENUM ('earn','redeem','expire','adjust')
    """)
    op.execute("""
        CREATE TYPE notification_channel_enum AS ENUM ('whatsapp','sms','in_app')
    """)
    op.execute("""
        CREATE TYPE notification_status_enum AS ENUM
          ('pending','sent','delivered','failed')
    """)
    op.execute("""
        CREATE TYPE audit_actor_type AS ENUM ('user','system','sync_agent')
    """)
    op.execute("""
        CREATE TYPE sync_status_enum AS ENUM ('pending','processed','conflict','error')
    """)
    op.execute("""
        CREATE TYPE donor_status_enum AS ENUM
          ('active','temporarily_deferred','permanently_deferred')
    """)
    op.execute("""
        CREATE TYPE user_role_enum AS ENUM
          ('superadmin','district_admin','doctor','organizer','citizen')
    """)

    # ── 2. Tables (FK dependency order) ───────────────────────────────────────

    op.execute("""
        CREATE TABLE facilities (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name          VARCHAR(200) NOT NULL,
            facility_code VARCHAR(10)  NOT NULL UNIQUE,
            type          VARCHAR(50)  NOT NULL,
            address       TEXT,
            district      VARCHAR(100),
            state         VARCHAR(100) NOT NULL DEFAULT 'Chhattisgarh',
            phone         VARCHAR(20),
            is_active     BOOLEAN NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE users (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            facility_id     UUID REFERENCES facilities(id),
            role            user_role_enum NOT NULL,
            username        VARCHAR(100) NOT NULL UNIQUE,
            email           VARCHAR(200) UNIQUE,
            phone           VARCHAR(20),
            hashed_password VARCHAR(200) NOT NULL,
            display_name    VARCHAR(200),
            is_active       BOOLEAN NOT NULL DEFAULT TRUE,
            last_login_at   TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_users_username ON users(username)")

    op.execute("""
        CREATE TABLE refresh_tokens (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked    BOOLEAN NOT NULL DEFAULT FALSE,
            issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id)")
    op.execute("CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash)")

    op.execute("""
        CREATE TABLE donors (
            id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name                      VARCHAR(200) NOT NULL,
            date_of_birth             DATE,
            age_years                 SMALLINT,
            sex                       sex_enum,
            contact_phone             VARCHAR(20) NOT NULL,
            address                   TEXT,
            abha_reference            VARCHAR(100),
            abha_verified             BOOLEAN NOT NULL DEFAULT FALSE,
            blood_group               blood_group_enum,
            status                    donor_status_enum NOT NULL DEFAULT 'active',
            consent_given             BOOLEAN NOT NULL DEFAULT FALSE,
            consent_timestamp         TIMESTAMPTZ,
            consent_purpose           TEXT,
            registered_at_facility_id UUID REFERENCES facilities(id),
            user_id                   UUID UNIQUE REFERENCES users(id),
            created_by                UUID REFERENCES users(id),
            created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_donors_phone ON donors(contact_phone)")
    op.execute(
        "CREATE INDEX idx_donors_abha ON donors(abha_reference) "
        "WHERE abha_reference IS NOT NULL"
    )

    op.execute("""
        CREATE TABLE organizers (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id          UUID NOT NULL UNIQUE REFERENCES users(id),
            org_name         VARCHAR(200) NOT NULL,
            org_type         VARCHAR(50),
            org_category     org_category_enum,
            contact_name     VARCHAR(200),
            contact_role     VARCHAR(100),
            contact_phone    VARCHAR(20),
            contact_email    VARCHAR(200),
            contact_address  TEXT,
            address          TEXT,
            is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE organizer_directory (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category      org_category_enum NOT NULL,
            org_name      VARCHAR(300) NOT NULL,
            contact_role  VARCHAR(100),
            location      VARCHAR(200),
            mobile        VARCHAR(20),
            source_serial INTEGER,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_organizer_directory_category ON organizer_directory(category)")
    op.execute("CREATE INDEX idx_organizer_directory_mobile ON organizer_directory(mobile)")

    # screenings — camp_id FK added after camps table is created
    op.execute("""
        CREATE TABLE screenings (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donor_id            UUID NOT NULL REFERENCES donors(id),
            camp_id             UUID,
            screened_by         UUID REFERENCES users(id),
            screening_datetime  TIMESTAMPTZ NOT NULL,
            weight_kg           NUMERIC(5,2),
            bp_systolic         SMALLINT,
            bp_diastolic        SMALLINT,
            pulse_bpm           SMALLINT,
            temperature_celsius NUMERIC(4,1),
            hemoglobin_g_dl     NUMERIC(4,1),
            questionnaire       JSONB NOT NULL DEFAULT '{}',
            eligibility_result  eligibility_result_enum NOT NULL,
            deferral_reason     VARCHAR(500),
            deferral_until      DATE,
            captured_offline    BOOLEAN NOT NULL DEFAULT FALSE,
            device_id           VARCHAR(100),
            sync_id             UUID,
            synced_at           TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_screenings_donor ON screenings(donor_id)")
    op.execute(
        "CREATE UNIQUE INDEX idx_screenings_sync_uniq ON screenings(sync_id) "
        "WHERE sync_id IS NOT NULL"
    )

    op.execute("""
        CREATE TABLE camps (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organizer_id      UUID NOT NULL REFERENCES organizers(id),
            host_facility_id  UUID NOT NULL REFERENCES facilities(id),
            camp_name         VARCHAR(200),
            requested_date    DATE NOT NULL,
            location          VARCHAR(300) NOT NULL,
            expected_donors   SMALLINT,
            venue_mode        venue_mode_enum NOT NULL DEFAULT 'district_blood_bank',
            alternate_dates   JSONB,
            special_date_note VARCHAR(300),
            camps_per_year    SMALLINT,
            status            camp_status_enum NOT NULL DEFAULT 'draft',
            coupon_prefix     VARCHAR(10),
            approved_by       UUID REFERENCES users(id),
            approval_datetime TIMESTAMPTZ,
            rejection_reason  TEXT,
            notes             TEXT,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_camps_organizer ON camps(organizer_id)")
    op.execute("CREATE INDEX idx_camps_date ON camps(requested_date)")
    op.execute(
        "CREATE UNIQUE INDEX idx_camps_facility_date "
        "ON camps(host_facility_id, requested_date) "
        "WHERE status IN ('submitted','under_review','approved')"
    )

    # Add deferred FK from screenings to camps
    op.execute(
        "ALTER TABLE screenings ADD CONSTRAINT fk_screenings_camp "
        "FOREIGN KEY (camp_id) REFERENCES camps(id)"
    )

    op.execute("""
        CREATE TABLE camp_coupons (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            camp_id          UUID NOT NULL REFERENCES camps(id),
            coupon_code      VARCHAR(20) NOT NULL UNIQUE,
            is_used          BOOLEAN NOT NULL DEFAULT FALSE,
            used_by_donor_id UUID REFERENCES donors(id),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_camp_coupons_camp ON camp_coupons(camp_id)")

    op.execute("""
        CREATE TABLE camp_bookings (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            camp_id    UUID NOT NULL REFERENCES camps(id),
            donor_id   UUID NOT NULL REFERENCES donors(id),
            status     VARCHAR(20) NOT NULL DEFAULT 'requested',
            notes      TEXT,
            reviewed_by UUID REFERENCES users(id),
            reviewed_at TIMESTAMPTZ,
            review_notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_camp_bookings_camp_donor UNIQUE (camp_id, donor_id)
        )
    """)
    op.execute("CREATE INDEX idx_camp_bookings_camp ON camp_bookings(camp_id)")
    op.execute("CREATE INDEX idx_camp_bookings_donor ON camp_bookings(donor_id)")

    # donations — camp_id FK added after camps
    op.execute("""
        CREATE TABLE donations (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donor_id            UUID NOT NULL REFERENCES donors(id),
            screening_id        UUID NOT NULL REFERENCES screenings(id),
            camp_id             UUID REFERENCES camps(id),
            facility_id         UUID NOT NULL REFERENCES facilities(id),
            collected_by        UUID REFERENCES users(id),
            collection_datetime TIMESTAMPTZ NOT NULL,
            donation_type       VARCHAR(20) NOT NULL DEFAULT 'voluntary',
            volume_ml           SMALLINT,
            captured_offline    BOOLEAN NOT NULL DEFAULT FALSE,
            sync_id             UUID,
            synced_at           TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_donations_donor ON donations(donor_id)")
    op.execute(
        "CREATE INDEX idx_donations_camp ON donations(camp_id) WHERE camp_id IS NOT NULL"
    )
    op.execute(
        "CREATE UNIQUE INDEX idx_donations_sync_uniq ON donations(sync_id) "
        "WHERE sync_id IS NOT NULL"
    )

    op.execute("""
        CREATE TABLE donation_certificates (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donation_id         UUID NOT NULL UNIQUE REFERENCES donations(id),
            donor_id            UUID NOT NULL REFERENCES donors(id),
            facility_id         UUID NOT NULL REFERENCES facilities(id),
            certificate_number  VARCHAR(40) NOT NULL UNIQUE,
            donor_name          VARCHAR(200) NOT NULL,
            blood_group         VARCHAR(5),
            donation_date       DATE NOT NULL,
            volume_ml           SMALLINT,
            issued_at           TIMESTAMPTZ NOT NULL,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_donation_certificates_donor ON donation_certificates(donor_id)")

    op.execute("""
        CREATE TABLE blood_units (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            barcode             VARCHAR(20) NOT NULL UNIQUE,
            donation_id         UUID NOT NULL REFERENCES donations(id),
            blood_group         blood_group_enum NOT NULL,
            facility_id         UUID NOT NULL REFERENCES facilities(id),
            collection_datetime TIMESTAMPTZ NOT NULL,
            expiry_datetime     TIMESTAMPTZ NOT NULL,
            release_status      unit_release_status NOT NULL DEFAULT 'pending',
            lifecycle_state     unit_lifecycle_state NOT NULL DEFAULT 'collected',
            discarded_reason    TEXT,
            created_by          UUID REFERENCES users(id),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_units_barcode  ON blood_units(barcode)")
    op.execute("CREATE INDEX idx_units_donation ON blood_units(donation_id)")
    op.execute("CREATE INDEX idx_units_state    ON blood_units(lifecycle_state)")
    op.execute(
        "CREATE INDEX idx_units_expiry ON blood_units(expiry_datetime) "
        "WHERE lifecycle_state NOT IN ('issued','transfused','discarded','expired')"
    )

    op.execute("""
        CREATE TABLE test_results (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            unit_id           UUID NOT NULL REFERENCES blood_units(id),
            test_panel        VARCHAR(50) NOT NULL,
            result            test_result_enum NOT NULL,
            tested_by         UUID REFERENCES users(id),
            tested_datetime   TIMESTAMPTZ NOT NULL,
            released_by       UUID REFERENCES users(id),
            released_datetime TIMESTAMPTZ,
            notes             TEXT,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (unit_id, test_panel)
        )
    """)
    op.execute("CREATE INDEX idx_test_results_unit ON test_results(unit_id)")

    op.execute("""
        CREATE TABLE components (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            unit_id         UUID NOT NULL REFERENCES blood_units(id),
            type            component_type_enum NOT NULL,
            volume_ml       SMALLINT,
            blood_group     blood_group_enum NOT NULL,
            expiry_datetime TIMESTAMPTZ NOT NULL,
            state           component_state_enum NOT NULL DEFAULT 'available',
            facility_id     UUID NOT NULL REFERENCES facilities(id),
            discarded_reason TEXT,
            created_by      UUID REFERENCES users(id),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_components_unit  ON components(unit_id)")
    op.execute("CREATE INDEX idx_components_state ON components(state)")
    op.execute(
        "CREATE INDEX idx_components_fefo "
        "ON components(blood_group, type, expiry_datetime) WHERE state = 'available'"
    )

    op.execute("""
        CREATE TABLE stock_ledger (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            facility_id    UUID NOT NULL REFERENCES facilities(id),
            blood_group    blood_group_enum NOT NULL,
            component_type component_type_enum NOT NULL,
            change_qty     SMALLINT NOT NULL,
            reason         ledger_reason_enum NOT NULL,
            reference_id   UUID,
            reference_type VARCHAR(50),
            balance_after  SMALLINT NOT NULL,
            recorded_by    UUID REFERENCES users(id),
            recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX idx_ledger_lookup "
        "ON stock_ledger(facility_id, blood_group, component_type, recorded_at DESC)"
    )

    op.execute("""
        CREATE TABLE alert_thresholds (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            facility_id      UUID NOT NULL REFERENCES facilities(id),
            blood_group      blood_group_enum NOT NULL,
            component_type   component_type_enum NOT NULL,
            low_stock_qty    SMALLINT NOT NULL DEFAULT 2,
            near_expiry_days SMALLINT NOT NULL DEFAULT 3,
            updated_by       UUID REFERENCES users(id),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (facility_id, blood_group, component_type)
        )
    """)

    op.execute("""
        CREATE TABLE barcode_sequences (
            facility_id UUID PRIMARY KEY REFERENCES facilities(id),
            last_seq    INTEGER NOT NULL DEFAULT 0
        )
    """)

    op.execute("""
        CREATE TABLE barcode_allocations (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            facility_id    UUID NOT NULL REFERENCES facilities(id),
            allocated_to   UUID REFERENCES users(id),
            camp_id        UUID REFERENCES camps(id),
            sequence_start INTEGER NOT NULL,
            sequence_end   INTEGER NOT NULL,
            next_sequence  INTEGER NOT NULL,
            allocated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            fully_returned BOOLEAN NOT NULL DEFAULT FALSE,
            returned_at    TIMESTAMPTZ,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE requisitions (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            facility_id         UUID NOT NULL REFERENCES facilities(id),
            patient_name        VARCHAR(200),
            patient_hospital_id VARCHAR(100),
            blood_group         blood_group_enum NOT NULL,
            component_type      component_type_enum NOT NULL,
            units_requested     SMALLINT NOT NULL DEFAULT 1,
            priority            requisition_priority_enum NOT NULL DEFAULT 'routine',
            status              requisition_status_enum NOT NULL DEFAULT 'pending',
            clinical_indication TEXT,
            requested_by        UUID REFERENCES users(id),
            requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            fulfilled_at        TIMESTAMPTZ,
            notes               TEXT,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_requisitions_status   ON requisitions(status)")
    op.execute("CREATE INDEX idx_requisitions_priority ON requisitions(priority, requested_at)")

    op.execute("""
        CREATE TABLE issues (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            requisition_id       UUID NOT NULL REFERENCES requisitions(id),
            component_id         UUID NOT NULL UNIQUE REFERENCES components(id),
            issued_by            UUID REFERENCES users(id),
            issue_datetime       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            transfusion_datetime TIMESTAMPTZ,
            transfused_by        UUID REFERENCES users(id),
            outcome              VARCHAR(20),
            outcome_notes        TEXT,
            created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_issues_requisition ON issues(requisition_id)")
    op.execute("CREATE INDEX idx_issues_component   ON issues(component_id)")

    op.execute("""
        CREATE TABLE wallet_accounts (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donor_id   UUID NOT NULL UNIQUE REFERENCES donors(id),
            balance    SMALLINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
            is_active  BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE wallet_transactions (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            wallet_id            UUID NOT NULL REFERENCES wallet_accounts(id),
            type                 wallet_txn_type_enum NOT NULL,
            amount               SMALLINT NOT NULL CHECK (amount > 0),
            balance_after        SMALLINT NOT NULL,
            reference_type       VARCHAR(50),
            reference_id         UUID,
            beneficiary_donor_id UUID REFERENCES donors(id),
            expiry_date          DATE,
            notes                TEXT,
            recorded_by          UUID REFERENCES users(id),
            recorded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX idx_wallet_txn_wallet "
        "ON wallet_transactions(wallet_id, recorded_at DESC)"
    )

    op.execute("""
        CREATE TABLE wallet_family_links (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            primary_donor_id     UUID NOT NULL REFERENCES donors(id),
            beneficiary_donor_id UUID NOT NULL REFERENCES donors(id),
            relationship         VARCHAR(50),
            is_verified          BOOLEAN NOT NULL DEFAULT FALSE,
            created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (primary_donor_id, beneficiary_donor_id)
        )
    """)

    op.execute("""
        CREATE TABLE notifications (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipient_user_id   UUID REFERENCES users(id),
            recipient_donor_id  UUID REFERENCES donors(id),
            channel             notification_channel_enum NOT NULL,
            template_name       VARCHAR(100) NOT NULL,
            payload             JSONB NOT NULL DEFAULT '{}',
            status              notification_status_enum NOT NULL DEFAULT 'pending',
            provider_message_id VARCHAR(200),
            sent_at             TIMESTAMPTZ,
            error_detail        TEXT,
            celery_task_id      VARCHAR(200),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX idx_notifications_pending ON notifications(status) "
        "WHERE status IN ('pending','failed')"
    )

    op.execute("""
        CREATE TABLE sync_queue (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id       VARCHAR(100) NOT NULL,
            entity_type     VARCHAR(50) NOT NULL,
            sync_id         UUID NOT NULL UNIQUE,
            payload         JSONB NOT NULL,
            status          sync_status_enum NOT NULL DEFAULT 'pending',
            conflict_reason TEXT,
            processed_at    TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX idx_sync_pending ON sync_queue(status) WHERE status = 'pending'"
    )

    op.execute("""
        CREATE TABLE audit_logs (
            id           BIGSERIAL PRIMARY KEY,
            actor_id     UUID,
            actor_type   audit_actor_type NOT NULL,
            action       VARCHAR(100) NOT NULL,
            entity_type  VARCHAR(50) NOT NULL,
            entity_id    UUID NOT NULL,
            before_state JSONB,
            after_state  JSONB,
            ip_address   VARCHAR(45),
            user_agent   TEXT,
            request_id   VARCHAR(100),
            timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_audit_entity    ON audit_logs(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_audit_actor     ON audit_logs(actor_id, timestamp DESC)")
    op.execute("CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC)")
    # Protect audit log from modification
    op.execute(
        "CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING"
    )
    op.execute(
        "CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING"
    )

    op.execute("""
        CREATE TABLE feature_flags (
            id          SMALLSERIAL PRIMARY KEY,
            name        VARCHAR(100) NOT NULL UNIQUE,
            is_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
            description TEXT,
            updated_by  UUID REFERENCES users(id),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    # ── 3. Seed feature flags ─────────────────────────────────────────────────
    op.execute("""
        INSERT INTO feature_flags (name, is_enabled, description) VALUES
        ('wallet_enabled', FALSE,
         'Blood Credit Wallet. Requires clinical/legal sign-off (BRULE-06) before enabling.')
    """)

    # ── 4. updated_at trigger function ────────────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    for tbl in [
        "facilities", "users", "donors", "organizers", "screenings",
        "camps", "camp_bookings", "components", "blood_units", "alert_thresholds",
        "requisitions", "issues", "wallet_accounts", "notifications",
    ]:
        op.execute(f"""
            CREATE TRIGGER trg_{tbl}_updated_at
            BEFORE UPDATE ON {tbl}
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
        """)


def downgrade() -> None:
    # Drop triggers
    for tbl in [
        "facilities", "users", "donors", "organizers", "screenings",
        "camps", "camp_bookings", "components", "blood_units", "alert_thresholds",
        "requisitions", "issues", "wallet_accounts", "notifications",
    ]:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{tbl}_updated_at ON {tbl}")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at()")

    # Drop tables (reverse order)
    for tbl in [
        "feature_flags", "audit_logs", "sync_queue", "notifications",
        "wallet_family_links", "wallet_transactions", "wallet_accounts",
        "issues", "requisitions", "barcode_allocations", "barcode_sequences",
        "alert_thresholds", "stock_ledger", "components", "test_results",
        "blood_units", "donations", "donation_certificates", "camp_bookings", "camp_coupons",
    ]:
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")
    op.execute("ALTER TABLE screenings DROP CONSTRAINT IF EXISTS fk_screenings_camp")
    op.execute("DROP TABLE IF EXISTS screenings CASCADE")
    op.execute("DROP TABLE IF EXISTS camps CASCADE")
    op.execute("DROP TABLE IF EXISTS organizer_directory CASCADE")
    op.execute("DROP TABLE IF EXISTS organizers CASCADE")
    op.execute("DROP TABLE IF EXISTS donors CASCADE")
    op.execute("DROP TABLE IF EXISTS refresh_tokens CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
    op.execute("DROP TABLE IF EXISTS facilities CASCADE")

    # Drop enum types
    for t in [
        "user_role_enum", "donor_status_enum", "sync_status_enum",
        "audit_actor_type", "notification_status_enum", "notification_channel_enum",
        "wallet_txn_type_enum", "ledger_reason_enum", "requisition_priority_enum",
        "requisition_status_enum", "venue_mode_enum", "org_category_enum", "camp_status_enum",
        "eligibility_result_enum",
        "test_result_enum", "component_state_enum", "unit_release_status",
        "unit_lifecycle_state", "component_type_enum", "sex_enum", "blood_group_enum",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {t}")
