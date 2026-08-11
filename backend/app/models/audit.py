import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin
from .enums import AuditActorType, SyncStatusEnum


class AuditLog(Base):
    """Append-only. No PK is UUID — using BIGINT for compact storage and fast range queries."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    actor_type: Mapped[AuditActorType] = mapped_column(
        sa.Enum(AuditActorType, name="audit_actor_type", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    action: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    before_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(sa.String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    request_id: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )

    __table_args__ = (
        sa.Index("idx_audit_entity", "entity_type", "entity_id"),
        sa.Index("idx_audit_actor", "actor_id", sa.desc(sa.text("timestamp"))),
        sa.Index("idx_audit_timestamp", sa.desc(sa.text("timestamp"))),
    )


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[int] = mapped_column(sa.SmallInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(sa.String(100), nullable=False, unique=True)
    is_enabled: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    description: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )


class SyncQueue(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "sync_queue"

    device_id: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    sync_id: Mapped[uuid.UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, unique=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[SyncStatusEnum] = mapped_column(
        sa.Enum(SyncStatusEnum, name="sync_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=SyncStatusEnum.PENDING,
    )
    conflict_reason: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)

    __table_args__ = (
        sa.Index(
            "idx_sync_pending",
            "status",
            postgresql_where=sa.text("status = 'pending'"),
        ),
    )
