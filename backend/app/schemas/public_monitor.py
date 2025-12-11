import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class PublicMonitorRead(BaseModel):
    id: uuid.UUID
    name: str = Field(max_length=200)
    target_url: str = Field(max_length=500)
    check_interval_sec: int = 60
    is_active: bool = True
    updated_at: datetime = Field(default=datetime.now(timezone.utc))
    project_id: uuid.UUID

    class ConfigDict:
        from_attributes = True
