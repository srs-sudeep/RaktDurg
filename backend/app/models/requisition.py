import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import BloodGroupEnum, ComponentTypeEnum, RequisitionPriorityEnum, RequisitionStatusEnum


class Requisition(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "requisitions"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    patient_name: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)
    patient_hospital_id: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    blood_group: Mapped[BloodGroupEnum] = mapped_column(
        sa.Enum(BloodGroupEnum, name="blood_group_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    component_type: Mapped[ComponentTypeEnum] = mapped_column(
        sa.Enum(ComponentTypeEnum, name="component_type_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    units_requested: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False, default=1)
    priority: Mapped[RequisitionPriorityEnum] = mapped_column(
        sa.Enum(RequisitionPriorityEnum, name="requisition_priority_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=RequisitionPriorityEnum.ROUTINE,
    )
    status: Mapped[RequisitionStatusEnum] = mapped_column(
        sa.Enum(RequisitionStatusEnum, name="requisition_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=RequisitionStatusEnum.PENDING,
    )
    clinical_indication: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    requested_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    requested_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )
    fulfilled_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    issues: Mapped[list["Issue"]] = relationship(
        "Issue", back_populates="requisition", cascade="all, delete-orphan"
    )

    __table_args__ = (
        sa.Index("idx_requisitions_status", "status"),
        sa.Index("idx_requisitions_priority", "priority", "requested_at"),
    )

    def __repr__(self) -> str:
        return f"<Requisition {self.blood_group.value} {self.component_type.value} [{self.priority.value}]>"


class Issue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "issues"

    requisition_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("requisitions.id"), nullable=False
    )
    component_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("components.id"), nullable=False, unique=True
    )
    issued_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    issue_datetime: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )
    transfusion_datetime: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), nullable=True
    )
    transfused_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    outcome: Mapped[str | None] = mapped_column(sa.String(20), nullable=True)
    outcome_notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    requisition: Mapped[Requisition] = relationship("Requisition", back_populates="issues")
    component: Mapped["Component"] = relationship("Component", back_populates="issue")  # type: ignore[name-defined]

    __table_args__ = (
        sa.Index("idx_issues_requisition", "requisition_id"),
        sa.Index("idx_issues_component", "component_id"),
    )
