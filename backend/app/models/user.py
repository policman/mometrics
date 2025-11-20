import uuid
from datetime import datetime as dt, UTC

from app.db.base import Base
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped as M, mapped_column as mc

class User(Base):
    __tablename__ = "users"

    id: M[uuid.UUID] = mc(
        primary_key=True,
        default=uuid.uuid4()
    )
    email: M[str] = mc(
        String(320),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: M[str] = mc(
        String(256),
        nullable=False,
    )
    is_active: M[bool] = mc(
        Boolean,
        default=True,
        nullable=False,
    )
    is_superuser: M[bool] = mc(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: M[dt] = mc(
        DateTime(timezone=True),
        default=lambda: dt.now(UTC),
        nullable=False,
    )
    updated_at: M[dt] = mc(
        DateTime(timezone=True),
        default=lambda: dt.now(UTC),
        onupdate=lambda: dt.now(UTC),
        nullable=False,
    )

