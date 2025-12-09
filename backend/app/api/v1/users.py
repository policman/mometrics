import uuid
from sys import prefix

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.core.deps import get_current_user
from app.crud.user import create_user, get_user, get_user_by_email, get_users
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(user_in: UserCreate, db: AsyncSession = Depends(get_async_db)):
    exiting = await get_user_by_email(db, str(user_in.email))
    if exiting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    return await create_user(db, user_in)


@router.get("/{user_id}", response_model=UserRead)
async def get_user_by_id_endpoint(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db),
):
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@router.get("", response_model=list[UserRead])
async def get_users_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db),
):
    return await get_users(db, skip=skip, limit=limit)


