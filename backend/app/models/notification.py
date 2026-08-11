import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from .enums import NotificationChannelEnum, NotificationStatusEnum


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notifications"

    recipient_user_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
    )
    recipient_donor_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), sa.ForeignKey("donors.id"), nullable=True
    )
    channel: Mapped[NotificationChannelEnum] = mapped_column(
        sa.Enum(NotificationChannelEnum, name="notification_channel_enum", values_callable=lambda e: [i.value for i in e]), nullable=False
    )
    template_name: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
    )
    status: Mapped[NotificationStatusEnum] = mapped_column(
        sa.Enum(NotificationStatusEnum, name="notification_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=NotificationStatusEnum.PENDING,
    )
    provider_message_id: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    error_detail: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    celery_task_id: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)

    __table_args__ = (
        sa.Index(
            "idx_notifications_pending",
            "status",
            postgresql_where=sa.text("status IN ('pending','failed')"),
        ),
    )
