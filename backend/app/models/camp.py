import uuid
from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import CampStatusEnum


class Camp(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "camps"

    organizer_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("organizers.id"), nullable=False
    )
    host_facility_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=False
    )
    camp_name: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)
    requested_date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    location: Mapped[str] = mapped_column(sa.String(300), nullable=False)
    expected_donors: Mapped[int | None] = mapped_column(sa.SmallInteger, nullable=True)
    status: Mapped[CampStatusEnum] = mapped_column(
        sa.Enum(CampStatusEnum, name="camp_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=CampStatusEnum.DRAFT,
    )
    coupon_prefix: Mapped[str | None] = mapped_column(sa.String(10), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    approval_datetime: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    organizer: Mapped["Organizer"] = relationship("Organizer", back_populates="camps")  # type: ignore[name-defined]
    coupons: Mapped[list["CampCoupon"]] = relationship(
        "CampCoupon", back_populates="camp", cascade="all, delete-orphan"
    )

    __table_args__ = (
        sa.Index("idx_camps_organizer", "organizer_id"),
        sa.Index("idx_camps_date", "requested_date"),
        sa.Index(
            "idx_camps_facility_date",
            "host_facility_id",
            "requested_date",
            unique=True,
            postgresql_where=sa.text("status IN ('submitted','under_review','approved')"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Camp {self.camp_name or self.id} on {self.requested_date} [{self.status.value}]>"


class CampCoupon(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "camp_coupons"

    camp_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("camps.id"), nullable=False
    )
    coupon_code: Mapped[str] = mapped_column(sa.String(20), nullable=False, unique=True)
    is_used: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    used_by_donor_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=True
    )

    camp: Mapped[Camp] = relationship("Camp", back_populates="coupons")

    __table_args__ = (sa.Index("idx_camp_coupons_camp", "camp_id"),)
