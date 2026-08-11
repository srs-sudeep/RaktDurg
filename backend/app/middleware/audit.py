"""
Audit logging utilities.

The AuditMiddleware sets request.state.actor_id and request.state.request_id
on every incoming request. Routes and services call log_audit() explicitly for
sensitive actions (unit state changes, PII reads). The middleware itself logs
generic write actions for complete coverage.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.audit import AuditLog
from app.models.enums import AuditActorType

# HTTP methods that constitute a write and should always be logged
_WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths that carry PII and must log even on GET
_PII_PATH_PREFIXES = ("/donors/", "/users/")


def _extract_actor(request: Request) -> tuple[uuid.UUID | None, AuditActorType]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, AuditActorType.SYSTEM
    try:
        payload = jwt.decode(
            auth[7:],
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return uuid.UUID(payload["sub"]), AuditActorType.USER
    except (JWTError, KeyError, ValueError):
        return None, AuditActorType.SYSTEM


def _parse_entity(request: Request) -> tuple[str, str | None]:
    """Best-effort entity_type and entity_id from path."""
    parts = [p for p in request.url.path.split("/") if p]
    # /units/{id}/... → entity_type=blood_unit, entity_id=parts[1]
    if len(parts) >= 1:
        entity_type = parts[0].rstrip("s")  # crude singularisation
        entity_id = parts[1] if len(parts) >= 2 else None
        return entity_type, entity_id
    return "unknown", None


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        actor_id, actor_type = _extract_actor(request)

        request.state.request_id = request_id
        request.state.actor_id = actor_id
        request.state.actor_type = actor_type

        response = await call_next(request)

        should_log = (
            request.method in _WRITE_METHODS
            or any(request.url.path.startswith(p) for p in _PII_PATH_PREFIXES)
        )

        if should_log and response.status_code < 500:
            entity_type, entity_id_str = _parse_entity(request)
            action = f"{request.method.lower()}.{entity_type}"
            entity_uuid = None
            if entity_id_str:
                try:
                    entity_uuid = uuid.UUID(entity_id_str)
                except ValueError:
                    entity_uuid = uuid.uuid4()  # fallback for non-UUID path params
            else:
                entity_uuid = uuid.uuid4()

            await _write_audit_log(
                actor_id=actor_id,
                actor_type=actor_type,
                action=action,
                entity_type=entity_type,
                entity_id=entity_uuid,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                request_id=request_id,
            )

        return response


async def _write_audit_log(
    *,
    actor_id: uuid.UUID | None,
    actor_type: AuditActorType,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before_state: dict | None = None,
    after_state: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    request_id: str | None = None,
) -> None:
    """Write one audit entry using a fresh DB session (safe to call from middleware)."""
    async with AsyncSessionLocal() as db:
        entry = AuditLog(
            actor_id=actor_id,
            actor_type=actor_type,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(entry)
        await db.commit()


async def log_audit(
    *,
    db: AsyncSession,
    actor_id: uuid.UUID | None,
    actor_type: AuditActorType = AuditActorType.USER,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before_state: dict[str, Any] | None = None,
    after_state: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> None:
    """Explicit audit log helper for service-layer calls (shares the request DB session)."""
    entry = AuditLog(
        actor_id=actor_id,
        actor_type=actor_type,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
        timestamp=datetime.now(timezone.utc),
        request_id=request_id,
    )
    db.add(entry)
