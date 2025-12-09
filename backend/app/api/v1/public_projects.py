import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.public_project import (
    get_public_project_by_id,
    get_public_projects,
)
from app.db.session import get_async_db
from app.schemas.public_project import PublicProjectRead, PublicProjectStats

router = APIRouter(prefix="/public", tags=["public projects"])


@router.get("/projects", response_model=list[PublicProjectRead])
async def get_public_projects_endpoint(
    limit: int = 20, skip: int = 0, db: AsyncSession = Depends(get_async_db)
) -> list[PublicProjectRead]:
    projects = await get_public_projects(limit, skip, db)
    if not projects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found public projects",
        )
    return projects


@router.get("/projects/{project_id}", response_model=PublicProjectRead)
async def get_public_project_endpoint(
    project_id: uuid.UUID, db: AsyncSession = Depends(get_async_db)
) -> PublicProjectRead:
    project = await get_public_project_by_id(project_id, db)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    return project
