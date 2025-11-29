from datetime import datetime
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
    created_at: datetime
    updated_at: datetime

    class ConfigDict:
        from_attributes = True


class MonitorStats(BaseModel):
    monitor_id: str

    from_ts: datetime
    to_ts: datetime

    total_checks: int = 0
    up_checks: int = 0
    down_checks: int = 0

    uptime_percent: float = 0.0

    avg_response_time_ms: float | None = None

    last_status_up: bool | None = None
    last_status_code: int | None = None
    last_check_at: datetime | None = None