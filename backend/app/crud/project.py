import uuid
from datetime import datetime, timezone
from typing import Sequence, cast

from sqlalchemy import select, update
from sqlalchemy.engine.cursor import CursorResult
from sqlalchemy.ext.asyncio.session import AsyncSession


from app.crud.monitor import get_monitors_for_project, set_monitors_status_by_ids
from app.models import Project as ProjectModel, Monitor as MonitorModel
from app.models.user import User as UserModel
from app.schemas.project import ProjectCreate, ProjectEdit, ProjectRead


async def create_project(
        db: AsyncSession,
        owner: UserModel,
        project_in: ProjectCreate,
) -> ProjectModel:
    project = ProjectModel(
        name=project_in.name,
        description=project_in.description,
        is_active=project_in.is_active,
        owner_id=owner.id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

async def get_project(
        db: AsyncSession,
        project_id: uuid.UUID
) -> ProjectModel | None:
    return (await db.scalars(
        select(ProjectModel)
        .where(
            ProjectModel.id == project_id,
        )
    )).first()

async def get_projects_for_user(
        db: AsyncSession,
        owner_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
) -> Sequence[ProjectModel]:
    return (
        await db.scalars(
            select(ProjectModel)
            .where(ProjectModel.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
        )
    ).all()


async def get_projects_for_owner_by_id(
        db: AsyncSession,
        projects_ids: list[uuid.UUID],
        owner_id: uuid.UUID
) -> Sequence[ProjectModel]:
    return (
        await db.scalars(
            select(ProjectModel)
            .where(
                ProjectModel.id.in_(projects_ids),
                ProjectModel.owner_id == owner_id
            )
        )
    ).all()

async def set_projects_status_by_id(
        db: AsyncSession,
        projects_ids: list[uuid.UUID],
        is_active: bool
):
    current_time = datetime.now(timezone.utc)

    result = await db.execute(
        update(ProjectModel)
        .where(
            ProjectModel.id.in_(projects_ids),
            ProjectModel.is_active.is_(not is_active)
        )
        .values(
            is_active=is_active,
            updated_at=current_time
        )
    )
    rows_affected = cast(CursorResult, result).rowcount

    await db.execute(
        update(MonitorModel)
        .where(MonitorModel.project_id.in_(projects_ids))
        .values(
            is_active=is_active,
            updated_at=current_time
        )
    )

    await db.commit()

    return rows_affected


async def update_project(
        db: AsyncSession,
        project_db: ProjectModel,
        project_in: ProjectEdit
) -> ProjectModel:
    update_data = project_in.model_dump(exclude_unset=True)

    if not update_data:
        return project_db

    if "is_active" in update_data:
        new_status = update_data["is_active"]
        current_time = datetime.now(timezone.utc)

        await db.execute(
            update(MonitorModel)
            .where(MonitorModel.project_id == project_db.id)
            .values(is_active=new_status, updated_at=current_time)
        )

    for field, value in update_data.items():
        setattr(project_db, field, value)

    project_db.updated_at = datetime.now(timezone.utc)

    db.add(project_db)
    await db.commit()
    await db.refresh(project_db)

    return project_db

