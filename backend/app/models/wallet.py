import uuid
from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import WalletTxnTypeEnum


class WalletAccount(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "wallet_accounts"

    donor_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=False, unique=True
    )
    balance: Mapped[int] = mapped_column(
        sa.SmallInteger,
        nullable=False,
        default=0,
        server_default=sa.text("0"),
    )
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=True)

    donor: Mapped["Donor"] = relationship("Donor", back_populates="wallet_account")  # type: ignore[name-defined]
    transactions: Mapped[list["WalletTransaction"]] = relationship(
        "WalletTransaction", back_populates="wallet", cascade="all, delete-orphan"
    )

    __table_args__ = (
        sa.CheckConstraint("balance >= 0", name="chk_wallet_balance_non_negative"),
    )


class WalletTransaction(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "wallet_transactions"

    wallet_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("wallet_accounts.id"), nullable=False
    )
    type: Mapped[WalletTxnTypeEnum] = mapped_column(
        sa.Enum(WalletTxnTypeEnum, name="wallet_txn_type_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    amount: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False)
    balance_after: Mapped[int] = mapped_column(sa.SmallInteger, nullable=False)
    reference_type: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    beneficiary_donor_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=True
    )
    expiry_date: Mapped[date | None] = mapped_column(sa.Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    recorded_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )

    wallet: Mapped[WalletAccount] = relationship("WalletAccount", back_populates="transactions")

    __table_args__ = (
        sa.CheckConstraint("amount > 0", name="chk_wallet_txn_amount_positive"),
        sa.Index("idx_wallet_txn_wallet", "wallet_id", sa.desc(sa.text("recorded_at"))),
    )


class WalletFamilyLink(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "wallet_family_links"

    primary_donor_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=False
    )
    beneficiary_donor_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=False
    )
    relationship: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    is_verified: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)

    __table_args__ = (
        sa.UniqueConstraint(
            "primary_donor_id", "beneficiary_donor_id", name="uq_wallet_family_link"
        ),
    )
