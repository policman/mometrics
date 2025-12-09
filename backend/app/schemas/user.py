import datetime as dt
import uuid

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    password: str  # temp


class UserRead(UserBase):
    id: uuid.UUID
    created_at: dt.datetime
    updated_at: dt.datetime

    class ConfigDict:
        from_attributes = True
