import uuid
from datetime import datetime

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
    created_at: datetime
    updated_at: datetime

    class ConfigDict:
        from_attributes = True


class ProjectIdList(BaseModel):
    ids: list[uuid.UUID]


class ProjectEdit(BaseModel):
    name: str = Field(max_length=100, default=None)
    description: str | None = None
    is_active: bool = True
