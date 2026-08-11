"""
ISBT 128–compatible barcode generation for RAKT Durg.

Format: RD + [facility_code:6] + [sequence:06d] + [check:1]  → 15 chars total.
Example: RDRKDURG000042C

The check character is computed as Luhn mod-10 over the preceding 14 chars
(letters mapped A→10 … Z→35, digits as-is).
The atomic sequence counter lives in barcode_sequences; incremented with
SELECT … FOR UPDATE to prevent races.
"""

import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stock import BarcodeSequence


_LUHN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _char_value(c: str) -> int:
    return _LUHN_ALPHABET.index(c)


def _luhn_check(payload: str) -> str:
    """Return a single Luhn mod-10 check character (base-36)."""
    total = 0
    for i, c in enumerate(reversed(payload)):
        v = _char_value(c)
        if i % 2 == 0:
            v *= 2
            if v > 35:
                v -= 35
        total += v
    check_val = (36 - (total % 36)) % 36
    return _LUHN_ALPHABET[check_val]


def _pad_facility(code: str) -> str:
    """Left-pad or truncate facility code to exactly 6 chars."""
    code = code.upper()[:6]
    return code.ljust(6, "X")


async def next_barcode(facility_id: uuid.UUID, facility_code: str, db: AsyncSession) -> str:
    """
    Atomically increment the facility sequence and return a new barcode.
    Must be called inside an open transaction (the caller controls commit).
    """
    stmt = (
        select(BarcodeSequence)
        .where(BarcodeSequence.facility_id == facility_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    seq_row = result.scalar_one_or_none()

    if seq_row is None:
        seq_row = BarcodeSequence(facility_id=facility_id, last_seq=0)
        db.add(seq_row)

    seq_row.last_seq += 1
    next_seq = seq_row.last_seq

    prefix = "RD" + _pad_facility(facility_code)
    payload = f"{prefix}{next_seq:06d}"
    check = _luhn_check(payload)
    return payload + check


def validate_barcode(barcode: str) -> bool:
    """Return True if the barcode passes the Luhn check."""
    if len(barcode) != 15:
        return False
    payload, check = barcode[:-1], barcode[-1]
    return _luhn_check(payload) == check
