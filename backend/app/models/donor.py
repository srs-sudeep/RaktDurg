import uuid
from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import (
    BloodGroupEnum,
    DonorStatusEnum,
    EligibilityResultEnum,
    SexEnum,
)


class Donor(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "donors"

    # Identity
    name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(sa.Date, nullable=True)
    age_years: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    sex: Mapped[SexEnum | None] = mapped_column(
        sa.Enum(SexEnum, name="sex_enum", values_callable=lambda e: [i.value for i in e]), nullable=True
    )
    # Contact
    contact_phone: Mapped[str] = mapped_column(sa.String(20), nullable=False)
    address: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    # ABHA — never raw Aadhaar
    abha_reference: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    abha_verified: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    # Medical
    blood_group: Mapped[BloodGroupEnum | None] = mapped_column(
        sa.Enum(BloodGroupEnum, name="blood_group_enum", values_callable=lambda e: [i.value for i in e]), nullable=True
    )
    status: Mapped[DonorStatusEnum] = mapped_column(
        sa.Enum(DonorStatusEnum, name="donor_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=DonorStatusEnum.ACTIVE,
    )
    # Consent (DPDP)
    consent_given: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    consent_timestamp: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), nullable=True
    )
    consent_purpose: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    # Meta
    registered_at_facility_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )

    screenings: Mapped[list["Screening"]] = relationship("Screening", back_populates="donor")
    donations: Mapped[list["Donation"]] = relationship("Donation", back_populates="donor")
    wallet_account: Mapped["WalletAccount | None"] = relationship(  # type: ignore[name-defined]
        "WalletAccount", back_populates="donor", uselist=False
    )

    __table_args__ = (
        sa.Index("idx_donors_phone", "contact_phone"),
        sa.Index(
            "idx_donors_abha",
            "abha_reference",
            postgresql_where=sa.text("abha_reference IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Donor {self.name} ({self.contact_phone})>"


class Organizer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True
    )
    org_name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    org_type: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(sa.String(20), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)
    address: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)

    camps: Mapped[list["Camp"]] = relationship("Camp", back_populates="organizer")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Organizer {self.org_name}>"


class Screening(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "screenings"

    donor_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=False
    )
    camp_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("camps.id"), nullable=True
    )
    screened_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    screening_datetime: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
    # Vitals
    weight_kg: Mapped[float | None] = mapped_column(sa.Numeric(5, 2), nullable=True)
    bp_systolic: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    bp_diastolic: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    pulse_bpm: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    temperature_celsius: Mapped[float | None] = mapped_column(sa.Numeric(4, 1), nullable=True)
    hemoglobin_g_dl: Mapped[float | None] = mapped_column(sa.Numeric(4, 1), nullable=True)
    questionnaire: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
    )
    # Eligibility
    eligibility_result: Mapped[EligibilityResultEnum] = mapped_column(
        sa.Enum(EligibilityResultEnum, name="eligibility_result_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    deferral_reason: Mapped[str | None] = mapped_column(sa.String(500), nullable=True)
    deferral_until: Mapped[date | None] = mapped_column(sa.Date, nullable=True)
    # Offline sync
    captured_offline: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    device_id: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    sync_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)

    donor: Mapped[Donor] = relationship("Donor", back_populates="screenings")
    donation: Mapped["Donation | None"] = relationship("Donation", back_populates="screening")

    __table_args__ = (
        sa.Index("idx_screenings_donor", "donor_id"),
        sa.Index(
            "idx_screenings_sync_uniq",
            "sync_id",
            unique=True,
            postgresql_where=sa.text("sync_id IS NOT NULL"),
        ),
    )


class Donation(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "donations"

    donor_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=False
    )
    screening_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("screenings.id"), nullable=False
    )
    camp_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("camps.id"), nullable=True
    )
    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    collected_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    collection_datetime: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
    donation_type: Mapped[str] = mapped_column(
        sa.String(20), nullable=False, default="voluntary"
    )
    volume_ml: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    # Offline sync
    captured_offline: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    sync_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)

    donor: Mapped[Donor] = relationship("Donor", back_populates="donations")
    screening: Mapped[Screening] = relationship("Screening", back_populates="donation")
    blood_unit: Mapped["BloodUnit | None"] = relationship(  # type: ignore[name-defined]
        "BloodUnit", back_populates="donation", uselist=False
    )

    __table_args__ = (
        sa.Index("idx_donations_donor", "donor_id"),
        sa.Index("idx_donations_camp", "camp_id", postgresql_where=sa.text("camp_id IS NOT NULL")),
        sa.Index(
            "idx_donations_sync_uniq",
            "sync_id",
            unique=True,
            postgresql_where=sa.text("sync_id IS NOT NULL"),
        ),
    )
