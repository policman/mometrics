from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy import ForeignKey, String, Integer, Boolean, DateTime
import datetime as dt
import uuid
from app.db.base import Base
from app.models import Project


class Monitor(Base):
    __tablename__ = "monitors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    target_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    check_interval_sec: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=60
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )


    project: Mapped["Project"] = relationship(
        back_populates="monitors"
    )
    check_results: Mapped[list["CheckResult"]] = relationship(
        back_populates="monitor",
        cascade="all, delete-orphan"
    )










