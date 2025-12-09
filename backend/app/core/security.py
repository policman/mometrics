import secrets
import uuid
from datetime import datetime as dt, UTC, timedelta
from fastapi import Depends

from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.orm.session import Session

from app.core.config import get_settings
from app.db.session import get_async_db
from app.models import RefreshToken

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(password, hashed)
    except UnknownHashError:
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    to_encode = data.copy()

    expire = dt.now(UTC) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")


async def create_refresh_token(
        db: AsyncSession,
        user_id: uuid.UUID,
        expires_delta: timedelta | None = None
) -> str:
    token_str = secrets.token_urlsafe(32)

    expire = dt.now(UTC) + (expires_delta or timedelta(days=30))

    db_token = RefreshToken(
        token=token_str,
        expires_at=expire,
        user_id=user_id
    )

    db.add(db_token)
    await db.commit()

    return token_str






