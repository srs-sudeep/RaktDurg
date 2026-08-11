"""Shared list-query helpers: search (q), allowlisted order_by/order."""

from __future__ import annotations

from typing import Any

from sqlalchemy import asc, desc, or_
from sqlalchemy.sql import ColumnElement, Select


def apply_ilike_search(stmt: Select[Any], q: str | None, *columns: ColumnElement[Any]) -> Select[Any]:
    """AND a case-insensitive OR across the given columns when q is non-empty."""
    if not q or not q.strip() or not columns:
        return stmt
    pattern = f"%{q.strip()}%"
    return stmt.where(or_(*(col.ilike(pattern) for col in columns)))


def apply_order(
    stmt: Select[Any],
    *,
    order_by: str | None,
    order: str | None,
    allowlist: dict[str, ColumnElement[Any]],
    default: str,
    default_dir: str = "desc",
) -> Select[Any]:
    """Apply allowlisted ORDER BY. Invalid keys fall back to default."""
    key = order_by if order_by in allowlist else default
    direction = (order or default_dir).lower()
    col = allowlist[key]
    return stmt.order_by(asc(col) if direction == "asc" else desc(col))
