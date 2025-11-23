import datetime as dt
import uuid

from pydantic import BaseModel, Field


class CheckResultBase(BaseModel):
    is_up: bool
    status_code: int | None = None
    response_time_ms: int | None = Field(
        default=None,
        description="Response time in milliseconds"
    )
    error_message: str | None = None

class CheckResultRead(CheckResultBase):
    id: uuid.UUID
    monitor_id: uuid.UUID
    checked_at: dt.datetime

    class Config:
        from_attributes = True