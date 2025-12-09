import uuid
from typing import Sequence
from datetime import datetime
from sqlalchemy import select

from app.models.check_result import CheckResult as CheckResultModel
from sqlalchemy.ext.asyncio.session import AsyncSession

async def create_check_result(
    db: AsyncSession,
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
    await db.commit()
    await db.refresh(result)
    return result

async def get_recent_results_for_monitor(
    db: AsyncSession,
    monitor_id: uuid.UUID,
    limit: int = 20,
) -> Sequence[CheckResultModel]:
    return (
        await db.scalars(
            select(CheckResultModel)
            .where(CheckResultModel.monitor_id == monitor_id)
            .limit(limit)
        )
    ).all()


async def get_checks_in_period(
    db: AsyncSession,
    monitor_id: uuid.UUID,
    from_ts: datetime,
    to_ts: datetime,
) -> Sequence[CheckResultModel]:
    return (await db.scalars(
        select(CheckResultModel)
        .where(
            CheckResultModel.monitor_id == monitor_id,
            CheckResultModel.checked_at >= from_ts,
            CheckResultModel.checked_at <= to_ts
        )
        .order_by(CheckResultModel.checked_at.asc())
    )).all()









