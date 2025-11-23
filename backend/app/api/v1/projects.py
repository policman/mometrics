import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.project import create_project, get_project, get_projects_for_user
from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.project import ProjectCreate, ProjectRead

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED
)
def create_project_endpoint(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> ProjectRead:
    project = create_project(db, current_user, project_in)
    return project


@router.get(
    "",
    response_model=list[ProjectRead],
)
def get_projects_endpoint(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(get_current_user)
) -> list[ProjectRead]:
    projects = get_projects_for_user(db, current_user.id, skip, limit)
    return list(projects)


@router.get(
    "{project_id}",
    response_model=ProjectRead
)
def get_project_by_id_endpoint(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> ProjectRead:
    project = get_project(db, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


































