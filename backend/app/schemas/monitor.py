from pydantic import BaseModel, Field, AnyHttpUrl
import uuid
import datetime as dt

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

    class Config:
        from_attributes = True