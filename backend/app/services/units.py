"""
Unit lifecycle service.

All state transitions are validated against the VALID_TRANSITIONS map.
Every component state change also posts a stock ledger entry via
services.stock.post_ledger_entry (both happen in the same transaction).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.barcode import next_barcode
from app.models.enums import (
    BloodGroupEnum,
    ComponentStateEnum,
    ComponentTypeEnum,
    LedgerReasonEnum,
    TestResultEnum,
    UnitLifecycleState,
    UnitReleaseStatus,
)
from app.models.facility import Facility
from app.models.unit import BloodUnit, Component, TestResult
from app.schemas.units import ComponentIn, SeparateComponentsRequest, UnitCreateRequest


# Valid state transitions for BloodUnit.lifecycle_state
VALID_TRANSITIONS: dict[UnitLifecycleState, set[UnitLifecycleState]] = {
    UnitLifecycleState.COLLECTED: {UnitLifecycleState.TESTED, UnitLifecycleState.DISCARDED},
    UnitLifecycleState.TESTED: {
        UnitLifecycleState.SEPARATED,
        UnitLifecycleState.STORED,
        UnitLifecycleState.DISCARDED,
    },
    UnitLifecycleState.SEPARATED: {UnitLifecycleState.STORED, UnitLifecycleState.DISCARDED},
    UnitLifecycleState.STORED: {
        UnitLifecycleState.RESERVED,
        UnitLifecycleState.DISCARDED,
        UnitLifecycleState.EXPIRED,
    },
    UnitLifecycleState.RESERVED: {
        UnitLifecycleState.STORED,
        UnitLifecycleState.ISSUED,
        UnitLifecycleState.DISCARDED,
    },
    UnitLifecycleState.ISSUED: {UnitLifecycleState.TRANSFUSED, UnitLifecycleState.DISCARDED},
    UnitLifecycleState.TRANSFUSED: set(),
    UnitLifecycleState.DISCARDED: set(),
    UnitLifecycleState.EXPIRED: set(),
}

# Required TTI test panels (configurable in future via feature flags)
REQUIRED_TEST_PANELS = frozenset(["HIV", "HBsAg", "HCV", "Malaria", "VDRL"])


class UnitStateError(ValueError):
    pass


async def create_unit(
    request: UnitCreateRequest,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> BloodUnit:
    facility_row = await db.get(Facility, request.facility_id)
    if not facility_row:
        raise ValueError("Facility not found")

    barcode = await next_barcode(request.facility_id, facility_row.facility_code, db)

    unit = BloodUnit(
        barcode=barcode,
        donation_id=request.donation_id,
        blood_group=request.blood_group,
        facility_id=request.facility_id,
        collection_datetime=request.collection_datetime,
        expiry_datetime=request.expiry_datetime,
        release_status=UnitReleaseStatus.PENDING,
        lifecycle_state=UnitLifecycleState.COLLECTED,
        created_by=actor_id,
    )
    db.add(unit)
    await db.flush()
    return unit


async def get_unit_by_barcode(barcode: str, db: AsyncSession) -> BloodUnit | None:
    result = await db.execute(select(BloodUnit).where(BloodUnit.barcode == barcode))
    return result.scalar_one_or_none()


async def record_test_results(
    unit: BloodUnit,
    panels: list,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> list[TestResult]:
    now = datetime.now(tz=timezone.utc)
    records: list[TestResult] = []
    any_reactive = False

    for item in panels:
        existing = await db.execute(
            select(TestResult).where(
                TestResult.unit_id == unit.id,
                TestResult.test_panel == item.test_panel,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Test panel '{item.test_panel}' already recorded for this unit")

        tr = TestResult(
            unit_id=unit.id,
            test_panel=item.test_panel,
            result=item.result,
            tested_by=actor_id,
            tested_datetime=now,
        )
        db.add(tr)
        records.append(tr)
        if item.result == TestResultEnum.REACTIVE:
            any_reactive = True

    await db.flush()

    # Check if all required panels are now recorded
    all_panels_result = await db.execute(
        select(TestResult).where(TestResult.unit_id == unit.id)
    )
    all_panels = all_panels_result.scalars().all()
    recorded_panels = {t.test_panel for t in all_panels}

    if REQUIRED_TEST_PANELS.issubset(recorded_panels):
        if any_reactive:
            unit.lifecycle_state = UnitLifecycleState.TESTED
            unit.release_status = UnitReleaseStatus.REJECTED
        else:
            unit.lifecycle_state = UnitLifecycleState.TESTED
            unit.release_status = UnitReleaseStatus.RELEASED

    return records


async def separate_components(
    unit: BloodUnit,
    request: SeparateComponentsRequest,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> list[Component]:
    if unit.lifecycle_state not in (UnitLifecycleState.TESTED, UnitLifecycleState.STORED):
        raise UnitStateError(
            f"Cannot separate components: unit is in state '{unit.lifecycle_state.value}'"
        )
    if unit.release_status != UnitReleaseStatus.RELEASED:
        raise UnitStateError("Cannot separate components: unit has not been released")

    from app.services.stock import post_ledger_entry

    components: list[Component] = []
    for item in request.components:
        comp = Component(
            unit_id=unit.id,
            type=item.type,
            volume_ml=item.volume_ml,
            blood_group=unit.blood_group,
            expiry_datetime=item.expiry_datetime,
            state=ComponentStateEnum.AVAILABLE,
            facility_id=unit.facility_id,
        )
        db.add(comp)
        components.append(comp)

    await db.flush()

    for comp in components:
        await post_ledger_entry(
            db=db,
            facility_id=unit.facility_id,
            blood_group=unit.blood_group,
            component_type=comp.type,
            change_qty=1,
            reason=LedgerReasonEnum.COLLECTION,
            reference_id=comp.id,
            reference_type="component",
            recorded_by=actor_id,
        )

    unit.lifecycle_state = UnitLifecycleState.SEPARATED
    return components


async def transition_unit(
    unit: BloodUnit,
    target: UnitLifecycleState,
    reason: str | None,
    db: AsyncSession,
) -> BloodUnit:
    allowed = VALID_TRANSITIONS.get(unit.lifecycle_state, set())
    if target not in allowed:
        raise UnitStateError(
            f"Invalid transition '{unit.lifecycle_state.value}' → '{target.value}'"
        )
    if target == UnitLifecycleState.DISCARDED:
        unit.discarded_reason = reason
    unit.lifecycle_state = target
    return unit
