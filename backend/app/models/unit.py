import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import (
    BloodGroupEnum,
    ComponentStateEnum,
    ComponentTypeEnum,
    TestResultEnum,
    UnitLifecycleState,
    UnitReleaseStatus,
)


class BloodUnit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "blood_units"

    barcode: Mapped[str] = mapped_column(sa.String(20), nullable=False, unique=True)
    donation_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donations.id"), nullable=False
    )
    blood_group: Mapped[BloodGroupEnum] = mapped_column(
        sa.Enum(BloodGroupEnum, name="blood_group_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    collection_datetime: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
    expiry_datetime: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    release_status: Mapped[UnitReleaseStatus] = mapped_column(
        sa.Enum(UnitReleaseStatus, name="unit_release_status", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=UnitReleaseStatus.PENDING,
    )
    lifecycle_state: Mapped[UnitLifecycleState] = mapped_column(
        sa.Enum(UnitLifecycleState, name="unit_lifecycle_state", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=UnitLifecycleState.COLLECTED,
    )
    discarded_reason: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )

    donation: Mapped["Donation"] = relationship("Donation", back_populates="blood_unit")  # type: ignore[name-defined]
    test_results: Mapped[list["TestResult"]] = relationship(
        "TestResult", back_populates="unit", cascade="all, delete-orphan"
    )
    components: Mapped[list["Component"]] = relationship(
        "Component", back_populates="unit", cascade="all, delete-orphan"
    )

    __table_args__ = (
        sa.Index("idx_units_barcode", "barcode"),
        sa.Index("idx_units_donation", "donation_id"),
        sa.Index("idx_units_state", "lifecycle_state"),
        sa.Index(
            "idx_units_expiry",
            "expiry_datetime",
            postgresql_where=sa.text(
                "lifecycle_state NOT IN ('issued','transfused','discarded','expired')"
            ),
        ),
    )

    def __repr__(self) -> str:
        return f"<BloodUnit {self.barcode} [{self.lifecycle_state.value}]>"


class TestResult(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "test_results"

    unit_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("blood_units.id"), nullable=False
    )
    test_panel: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    result: Mapped[TestResultEnum] = mapped_column(
        sa.Enum(TestResultEnum, name="test_result_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    tested_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    tested_datetime: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    released_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    released_datetime: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    unit: Mapped[BloodUnit] = relationship("BloodUnit", back_populates="test_results")

    __table_args__ = (
        sa.UniqueConstraint("unit_id", "test_panel", name="uq_test_results_unit_panel"),
        sa.Index("idx_test_results_unit", "unit_id"),
    )


class Component(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "components"

    unit_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("blood_units.id"), nullable=False
    )
    type: Mapped[ComponentTypeEnum] = mapped_column(
        sa.Enum(ComponentTypeEnum, name="component_type_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    volume_ml: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    blood_group: Mapped[BloodGroupEnum] = mapped_column(
        sa.Enum(BloodGroupEnum, name="blood_group_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    expiry_datetime: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    state: Mapped[ComponentStateEnum] = mapped_column(
        sa.Enum(ComponentStateEnum, name="component_state_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=ComponentStateEnum.AVAILABLE,
    )
    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    discarded_reason: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )

    unit: Mapped[BloodUnit] = relationship("BloodUnit", back_populates="components")
    issue: Mapped["Issue | None"] = relationship("Issue", back_populates="component", uselist=False)  # type: ignore[name-defined]

    __table_args__ = (
        sa.Index("idx_components_unit", "unit_id"),
        sa.Index("idx_components_state", "state"),
        sa.Index(
            "idx_components_fefo",
            "blood_group",
            "type",
            "expiry_datetime",
            postgresql_where=sa.text("state = 'available'"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Component {self.type.value} [{self.state.value}] exp={self.expiry_datetime.date()}>"
