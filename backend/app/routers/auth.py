from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import get_current_user
from app.models.auth import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserOut,
)
from app.services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter()


@router.post("/token", response_model=TokenResponse, summary="Login — obtain access + refresh tokens")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await authenticate_user(body.username, body.password, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    access_token, expires_in = create_access_token(user)
    refresh_token = await create_refresh_token(user.id, db)

    # Record last login
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/refresh", response_model=AccessTokenResponse, summary="Exchange refresh token for a new access token")
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AccessTokenResponse:
    result = await rotate_refresh_token(body.refresh_token, db)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid, expired, or already used",
        )

    user, _new_refresh = result
    access_token, expires_in = create_access_token(user)

    return AccessTokenResponse(access_token=access_token, expires_in=expires_in)


@router.post("/logout", summary="Revoke refresh token")
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> dict:
    await revoke_refresh_token(body.refresh_token, db)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut, summary="Current authenticated user")
async def me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> UserOut:
    donor_id = None
    if current_user.role.value == "citizen":
        from app.models.donor import Donor

        result = await db.execute(select(Donor.id).where(Donor.user_id == current_user.id))
        donor_id = result.scalar_one_or_none()
    return UserOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        phone=current_user.phone,
        display_name=current_user.display_name,
        role=current_user.role,
        facility_id=current_user.facility_id,
        donor_id=donor_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )
