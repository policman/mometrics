import datetime as dt
import uuid

from pydantic import AnyHttpUrl, BaseModel, Field


class MonitorBase(BaseModel):
    name: str = Field(..., max_length=200)
    target_url: AnyHttpUrl
    check_interval_sec: int = Field(default=60, ge=10, le=24*60*60)
    is_active: bool = True


class MonitorCreate(MonitorBase):
    pass


class MonitorRead(MonitorBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: dt.datetime
    updated_at: dt.datetime

    class ConfigDict:
        from_attributes = True