import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from app.models.project import Project as ProjectModel
from app.models.user import User as UserModel
from app.schemas.public_project import PublicProjectRead
from app.models.monitor import Monitor as MonitorModel

async def get_public_projects(
        limit: int,
        skip: int,
        db: AsyncSession
) -> Sequence[PublicProjectRead]:
    return (await db.scalars(
        select(ProjectModel)
        .join(UserModel, UserModel.id == ProjectModel.owner_id)
        .where(
            ProjectModel.owner_id == UserModel.id,
            UserModel.is_superuser.is_(True),
            ProjectModel.is_active.is_(True)
        )
        .limit(limit=limit)
        .offset(offset=skip)
    )).all()


async def get_public_project_by_id(
    project_id: uuid.UUID,
    db: AsyncSession
) -> ProjectModel | None:
    return (await db.scalars(
        select(ProjectModel)
        .join(UserModel, ProjectModel.owner_id == UserModel.id)
        .where(
            ProjectModel.id == project_id,
            ProjectModel.is_active.is_(True),
            UserModel.is_superuser.is_(True)
        )
    )).first()