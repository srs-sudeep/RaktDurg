import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.auth import RefreshToken, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    # bcrypt rejects secrets >72 bytes; passlib+bcrypt 4.1+ can raise during backend probe
    return pwd_context.hash(plain[:72] if isinstance(plain, str) else plain)


def verify_password(plain: str, hashed: str) -> bool:
    secret = plain[:72] if isinstance(plain, str) else plain
    return pwd_context.verify(secret, hashed)


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def create_access_token(user: User) -> tuple[str, int]:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {
        "sub": str(user.id),
        "role": user.role.value,
        "facility_id": str(user.facility_id) if user.facility_id else None,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


async def create_refresh_token(user_id: uuid.UUID, db: AsyncSession) -> str:
    raw = str(uuid.uuid4())
    token_hash = _hash_token(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_token)
    await db.flush()
    return raw


async def authenticate_user(username: str, password: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def decode_access_token(token: str) -> dict:
    """Raises JWTError on failure."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("not an access token")
    return payload


async def get_user_by_id(user_id: str, db: AsyncSession) -> User | None:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return None
    return await db.get(User, uid)


async def revoke_refresh_token(raw_token: str, db: AsyncSession) -> bool:
    token_hash = _hash_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )
    db_token = result.scalar_one_or_none()
    if db_token is None:
        return False
    db_token.revoked = True
    await db.flush()
    return True


async def rotate_refresh_token(raw_token: str, db: AsyncSession) -> tuple[User, str] | None:
    """Validates old refresh token, issues a new one (rotation). Returns (user, new_raw_token)."""
    token_hash = _hash_token(raw_token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > now,
        )
    )
    db_token = result.scalar_one_or_none()
    if db_token is None:
        return None

    user = await db.get(User, db_token.user_id)
    if user is None or not user.is_active:
        return None

    # Revoke old token
    db_token.revoked = True
    await db.flush()

    # Issue new token
    new_raw = await create_refresh_token(user.id, db)
    return user, new_raw
