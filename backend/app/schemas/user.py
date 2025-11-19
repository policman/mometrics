import uuid
import datetime as dt

from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str #temp

class UserRead(UserBase):
    id: uuid.UUID
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True