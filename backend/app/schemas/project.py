import datetime as dt
import uuid

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str = Field(max_length=100, default="Unnamed")
    description: str | None = None
    is_active: bool = True

class ProjectCreate(ProjectBase):
    pass

class ProjectRead(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID | None
    created_at: dt.datetime
    updated_at: dt.datetime

    class ConfigDict:
        from_attributes = True