import uuid

from pydantic import BaseModel, Field
from datetime import datetime, timezone


class PublicMonitorRead(BaseModel):
    id: uuid.UUID
    name: str = Field(max_length=200)
    target_url: str = Field(max_length=500)
    check_interval: int = 60
    is_active: bool = True
    updated_at: datetime = Field(default=datetime.now(timezone.utc))

    class ConfigDict:
        from_attributes = True
