import uuid
from datetime import datetime, timezone
from typing import Sequence, cast

from sqlalchemy import select, update
from sqlalchemy.engine.cursor import CursorResult
from sqlalchemy.orm import Session

from app.crud.monitor import get_monitors_for_project, set_monitors_status_by_ids
from app.models import Project as ProjectModel, Monitor as MonitorModel
from app.models.user import User as UserModel
from app.schemas.project import ProjectCreate, ProjectEdit, ProjectRead


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
    return db.scalars(
        select(ProjectModel)
        .where(
            ProjectModel.id == project_id,
            #ProjectModel.is_active.is_(True)
        )
    ).first()

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
                   #ProjectModel.is_active.is_(True)
                   )
            .offset(skip)
            .limit(limit)
        )
    ).all()


def get_projects_for_owner_by_id(
        db: Session,
        projects_ids: list[uuid.UUID],
        owner_id: uuid.UUID
) -> Sequence[ProjectModel]:
    return (
        db.scalars(
            select(ProjectModel)
            .where(
                ProjectModel.id.in_(projects_ids),
                ProjectModel.owner_id == owner_id
            )
        )
    ).all()

def set_projects_status_by_id(
        db: Session,
        projects_ids: list[uuid.UUID],
        is_active: bool
):
    current_time = datetime.now(timezone.utc)

    result = db.execute(
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

    monitors_id_to_set_status = db.scalars(
        select(MonitorModel.id)
        .where(MonitorModel.project_id.in_(projects_ids))
    ).all()

    _ = set_monitors_status_by_ids(db, monitors_id_to_set_status, is_active)

    db.commit()

    return rows_affected

def update_project(
        db: Session,
        project_db: ProjectModel,
        project_in: ProjectEdit
) -> ProjectModel:
    update_data = project_in.model_dump(exclude_unset=True)

    if not update_data:
        return project_db

    if "is_active" in update_data:
        new_status = update_data["is_active"]
        current_time = datetime.now(timezone.utc)

        db.execute(
            update(MonitorModel)
            .where(MonitorModel.project_id == project_db.id)
            .values(is_active=new_status, updated_at=current_time)
        )

    for field, value in update_data.items():
        setattr(project_db, field, value)

    project_db.updated_at = datetime.now(timezone.utc)

    db.add(project_db)
    db.commit()
    db.refresh(project_db)

    return project_db

