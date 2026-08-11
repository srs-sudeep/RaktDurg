from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.auth import User
from app.models.enums import UserRoleEnum
from app.services.auth import decode_access_token, get_user_by_id

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(payload["sub"], db)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_roles(*roles: UserRoleEnum):
    """Dependency factory that enforces one of the given roles."""

    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {[r.value for r in roles]}",
            )
        return user

    return _check


# Convenience pre-built dependencies
require_admin = require_roles(UserRoleEnum.ADMIN)

require_clinical = require_roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.MEDICAL_OFFICER,
)

require_lab = require_roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.MEDICAL_OFFICER,
    UserRoleEnum.LAB_TECH,
)

require_inventory = require_roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.MEDICAL_OFFICER,
    UserRoleEnum.INVENTORY_OFFICER,
)

require_phlebotomist = require_roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.MEDICAL_OFFICER,
    UserRoleEnum.PHLEBOTOMIST,
)

require_staff = require_roles(
    UserRoleEnum.ADMIN,
    UserRoleEnum.MEDICAL_OFFICER,
    UserRoleEnum.LAB_TECH,
    UserRoleEnum.PHLEBOTOMIST,
    UserRoleEnum.INVENTORY_OFFICER,
)
