import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate



def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.scalar(select(User).where(User.id == user_id))

def get_user_by_email(db: Session, user_email: str) -> User | None:
    return db.scalar(select(User).where(User.email == user_email))

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return (db.scalars(select(User).offset(skip).limit(limit))).all()

def create_user(db: Session, user_in: UserCreate) -> User:
    fake_hashed_password = f"not_really_hashed_{user_in.password}"

    user = User(
        email = user_in.email,
        hashed_password = fake_hashed_password,
        is_active = user_in.is_active,
        is_superuser = user_in.is_superuser
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


