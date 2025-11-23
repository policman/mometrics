import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.check_result import CheckResult as CheckResultModel


def create_check_result(
    db: Session,
    monitor_id: uuid.UUID,
    is_up: bool,
    status_code: int | None,
    response_time_ms: int | None,
    error_message: str | None,
) -> CheckResultModel:
    result = CheckResultModel(
        monitor_id=monitor_id,
        is_up=is_up,
        status_code=status_code,
        response_time_ms=response_time_ms,
        error_message=error_message
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

def get_recent_results_for_monitor(
    db: Session,
    monitor_id: uuid.UUID,
    limit: int = 20,
) -> Sequence[CheckResultModel]:
    return (
        db.scalars(
            select(CheckResultModel)
            .where(CheckResultModel.monitor_id == monitor_id)
            .limit(limit)
        )
    ).all()