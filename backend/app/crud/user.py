import uuid
from typing import Sequence

from sqlalchemy import select

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate
from sqlalchemy.ext.asyncio.session import AsyncSession

async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return (await db.scalars(select(User).where(User.id == user_id))).first()

async def get_user_by_email(db: AsyncSession, user_email: str) -> User | None:
    return (await db.scalars(select(User).where(User.email == user_email))).first()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> Sequence[User]:
    return (await db.scalars(select(User).offset(skip).limit(limit))).all()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    hashed = hash_password(user_in.password)

    user = User(
        email = user_in.email,
        hashed_password = hashed,
        is_active = user_in.is_active,
        is_superuser = user_in.is_superuser
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


