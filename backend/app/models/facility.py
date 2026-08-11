import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Facility(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "facilities"

    name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    facility_code: Mapped[str] = mapped_column(sa.String(10), nullable=False, unique=True)
    type: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    address: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    district: Mapped[str | None] = mapped_column(sa.String(100), nullable=True)
    state: Mapped[str] = mapped_column(sa.String(100), nullable=False, default="Chhattisgarh")
    phone: Mapped[str | None] = mapped_column(sa.String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=True)

    users: Mapped[list["User"]] = relationship("User", back_populates="facility")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Facility {self.facility_code} — {self.name}>"
