import datetime as dt
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class CheckResult(Base):
    __tablename__ = "check_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    monitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("monitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    checked_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    is_up: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )
    status_code: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )
    response_time_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True
    )

    monitor: Mapped["Monitor"] = relationship(
        back_populates="check_results"
    )