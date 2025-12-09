import uuid

from pydantic import BaseModel, Field
from datetime import datetime

class PublicProjectRead(BaseModel):
    id: uuid.UUID
    name: str = Field(max_length=100, default="Unnamed")
    description: str | None = None
    is_active: bool
    updated_at: datetime

    class ConfigDict:
        from_attributes = True

class PublicProjectStats(PublicProjectRead):
    uptime_percent: float = 0.0
    last_status_up: bool | None = None
    last_check_at: datetime | None = None