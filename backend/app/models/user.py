import uuid
import datetime as dt

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
    created_at: M[dt.datetime] = mc(
        DateTime(timezone=True),
        default=dt.datetime.now(dt.UTC),
        nullable=False,
    )
    updated_at: M[dt.datetime] = mc(
        DateTime(timezone=True),
        default=dt.datetime.now(dt.UTC),
        onupdate=dt.datetime.now(dt.UTC),
        nullable=False,
    )

