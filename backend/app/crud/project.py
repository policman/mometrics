import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Project as ProjectModel
from app.models.user import User as UserModel
from app.schemas.project import ProjectCreate


def create_project(
        db: Session,
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
    db.commit()
    db.refresh(project)
    return project

def get_project(db: Session, project_id: uuid.UUID) -> ProjectModel | None:
    return db.scalar(
        select(ProjectModel)
        .where(ProjectModel.id == project_id,
               ProjectModel.is_active.is_(True)
               )
    )

def get_projects_for_user(
        db: Session,
        owner_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
) -> Sequence[ProjectModel]:
    return (
        db.scalars(
            select(ProjectModel)
            .where(ProjectModel.owner_id == owner_id,
                   ProjectModel.is_active.is_(True)
                   )
            .offset(skip)
            .limit(limit)
        )
    ).all()