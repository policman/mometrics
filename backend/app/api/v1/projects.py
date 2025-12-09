import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.core.deps import get_current_user
from app.crud.project import (
    create_project,
    get_project,
    get_projects_for_user,
    get_projects_for_owner_by_id,
    set_projects_status_by_id,
    update_project
)
from app.db.session import get_async_db
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.schemas.project import ProjectCreate, ProjectRead, ProjectIdList, ProjectEdit

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED
)
async def create_project_endpoint(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
) -> ProjectRead:
    return await create_project(db, current_user, project_in)


@router.get(
    "",
    response_model=list[ProjectRead],
)
async def get_projects_endpoint(
        skip: int = 0,
        limit: int = 100,
        db: AsyncSession = Depends(get_async_db),
        current_user: UserModel = Depends(get_current_user)
) -> list[ProjectRead]:
    return list(await get_projects_for_user(db, current_user.id, skip, limit))


@router.get(
    "/{project_id}",
    response_model=ProjectRead
)
async def get_project_by_id_endpoint(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user)
) -> ProjectRead:
    project = await get_project(db, project_id)

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


@router.put(
    "/bulk-set-status",
    response_model=int
)
async def set_projects_status_by_id_endpoint(
    projects: ProjectIdList,
    is_active: bool,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user)
) -> int:
    if not projects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Projects list cannot be empty"
        )

    projects_to_set = await get_projects_for_owner_by_id(db, projects.ids, current_user.id)

    if len(projects.ids) != len(projects_to_set):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can deactivate project"
        )

    projects_to_set_ids = [project.id for project in projects_to_set]

    return await set_projects_status_by_id(db, projects_to_set_ids, is_active)


@router.patch(
    "/{project_id}",
    response_model=ProjectRead
)
async def update_project_endpoint(
    project_id: uuid.UUID,
    project_in: ProjectEdit,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user)
) -> ProjectModel:
    project_db = await get_project(db, project_id)

    if not project_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project_db.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can edit project info"
        )

    return await update_project(db, project_db, project_in)

























