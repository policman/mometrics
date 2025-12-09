import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
)
from app.crud.user import get_user_by_email
from app.db.session import get_async_db
from app.models import RefreshToken
from app.schemas.auth import RefreshTokenRequest, TokenResponse
from app.schemas.user import UserRead

logger = logging.getLogger("app.api.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db),
) -> TokenResponse:
    user = await get_user_by_email(db, form_data.username)

    if not user or not verify_password(form_data.password, str(user.hashed_password)):
        logger.warning("Login failed for email=%s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"sub": str(user.id)})

    refresh_token = await create_refresh_token(db, user.id)

    logger.info("Login success user_id=%s", user.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest, db: AsyncSession = Depends(get_async_db)
) -> TokenResponse:
    db_token = (
        await db.scalars(
            select(RefreshToken)
            .where(RefreshToken.token == request.refresh_token)
            .options(selectinload(RefreshToken.user))
        )
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if db_token.expires_at < datetime.now(timezone.utc):
        await db.delete(db_token)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    user = db_token.user
    if not user:
        await db.delete(db_token)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    await db.delete(db_token)
    await db.commit()

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = await create_refresh_token(db, user.id)

    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.get("/me", response_model=UserRead)
async def read_me(current_user=Depends(get_current_user)) -> UserRead:
    """Return cur user of token"""
    return current_user
