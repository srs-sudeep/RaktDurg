import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import UserRoleEnum


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    facility_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("facilities.id"), nullable=True
    )
    role: Mapped[UserRoleEnum] = mapped_column(
        sa.Enum(UserRoleEnum, name="user_role_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    username: Mapped[str] = mapped_column(sa.String(100), nullable=False, unique=True)
    email: Mapped[str | None] = mapped_column(sa.String(200), nullable=True, unique=True)
    phone: Mapped[str | None] = mapped_column(sa.String(20), nullable=True)
    hashed_password: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    display_name: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), nullable=True
    )

    facility: Mapped["Facility | None"] = relationship("Facility", back_populates="users")  # type: ignore[name-defined]
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    donor_profile: Mapped["Donor | None"] = relationship(  # type: ignore[name-defined]
        "Donor",
        back_populates="user_account",
        uselist=False,
        foreign_keys="Donor.user_id",
    )

    __table_args__ = (sa.Index("idx_users_username", "username"),)

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.value})>"


class RefreshToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(sa.String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    issued_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (
        sa.Index("idx_refresh_tokens_user", "user_id"),
        sa.Index("idx_refresh_tokens_hash", "token_hash"),
    )
