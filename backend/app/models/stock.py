import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import BloodGroupEnum, ComponentTypeEnum, LedgerReasonEnum


class StockLedger(UUIDPrimaryKeyMixin, Base):
    """Append-only ledger; never updated or deleted."""

    __tablename__ = "stock_ledger"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    blood_group: Mapped[BloodGroupEnum] = mapped_column(
        sa.Enum(BloodGroupEnum, name="blood_group_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    component_type: Mapped[ComponentTypeEnum] = mapped_column(
        sa.Enum(ComponentTypeEnum, name="component_type_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    change_qty: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False)
    reason: Mapped[LedgerReasonEnum] = mapped_column(
        sa.Enum(LedgerReasonEnum, name="ledger_reason_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    reference_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    reference_type: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    balance_after: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    recorded_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )

    __table_args__ = (
        sa.Index(
            "idx_ledger_lookup",
            "facility_id",
            "blood_group",
            "component_type",
            sa.desc(sa.text("recorded_at")),
        ),
    )


class AlertThreshold(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "alert_thresholds"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    blood_group: Mapped[BloodGroupEnum] = mapped_column(
        sa.Enum(BloodGroupEnum, name="blood_group_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    component_type: Mapped[ComponentTypeEnum] = mapped_column(
        sa.Enum(ComponentTypeEnum, name="component_type_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    low_stock_qty: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False, default=2)
    near_expiry_days: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False, default=3)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )

    __table_args__ = (
        sa.UniqueConstraint(
            "facility_id", "blood_group", "component_type", name="uq_alert_threshold"
        ),
    )


class BarcodeSequence(Base):
    """One row per facility; atomically incremented for barcode generation."""

    __tablename__ = "barcode_sequences"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), primary_key=True
    )
    last_seq: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)


class BarcodeAllocation(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "barcode_allocations"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    allocated_to: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    camp_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("camps.id"), nullable=True
    )
    sequence_start: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    sequence_end: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    next_sequence: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    allocated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )
    fully_returned: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    returned_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)
