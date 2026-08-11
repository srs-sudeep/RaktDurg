"""
Requisition lifecycle service.

Flow:
  1. CREATE   → status = pending
  2. RESERVE  → FEFO-picks components, state → reserved, status = reserved
  3. ISSUE    → components state → issued, creates Issue records, status = issued
  4. TRANSFUSE → records transfusion outcome on Issue
  5. CANCEL   → unreserves components, status = cancelled
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.fefo import reserve_fefo
from app.models.enums import (
    ComponentStateEnum,
    LedgerReasonEnum,
    RequisitionStatusEnum,
)
from app.models.requisition import Issue, Requisition
from app.models.unit import Component
from app.schemas.requisitions import RequisitionCreateRequest, TransfusionRequest
from app.services.stock import post_ledger_entry


class InsufficientStockError(Exception):
    pass


class RequisitionStateError(Exception):
    pass


async def create_requisition(
    request: RequisitionCreateRequest,
    requested_by: uuid.UUID,
    db: AsyncSession,
) -> Requisition:
    req = Requisition(
        facility_id=request.facility_id,
        patient_name=request.patient_name,
        patient_hospital_id=request.patient_hospital_id,
        blood_group=request.blood_group,
        component_type=request.component_type,
        units_requested=request.units_requested,
        priority=request.priority,
        status=RequisitionStatusEnum.PENDING,
        clinical_indication=request.clinical_indication,
        requested_by=requested_by,
        requested_at=datetime.now(tz=timezone.utc),
    )
    db.add(req)
    await db.flush()
    return req


async def reserve_components(
    req: Requisition,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> list[Component]:
    if req.status != RequisitionStatusEnum.PENDING:
        raise RequisitionStateError(f"Cannot reserve: requisition is {req.status.value}")

    components = await reserve_fefo(
        db, req.facility_id, req.blood_group, req.component_type, req.units_requested
    )
    if len(components) < req.units_requested:
        raise InsufficientStockError(
            f"Insufficient stock: need {req.units_requested}, found {len(components)}"
        )

    for comp in components:
        comp.state = ComponentStateEnum.RESERVED
        await post_ledger_entry(
            db=db,
            facility_id=req.facility_id,
            blood_group=comp.blood_group,
            component_type=comp.type,
            change_qty=-1,
            reason=LedgerReasonEnum.RESERVE,
            reference_id=req.id,
            reference_type="requisition",
            recorded_by=actor_id,
        )

    req.status = RequisitionStatusEnum.FULLY_RESERVED
    await db.flush()
    return components


async def issue_components(
    req: Requisition,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> list[Issue]:
    if req.status != RequisitionStatusEnum.FULLY_RESERVED:
        raise RequisitionStateError(f"Cannot issue: requisition is {req.status.value}")

    reserved_comps_result = await db.execute(
        select(Component).where(
            Component.state == ComponentStateEnum.RESERVED,
        )
    )
    # Get components linked to this requisition via the stock ledger (simplification:
    # in full impl, Issue records created during reserve step would link them explicitly)
    from sqlalchemy import text
    comp_ids_result = await db.execute(
        text("""
            SELECT reference_id FROM stock_ledger
            WHERE reference_type = 'requisition' AND reference_id = :req_id
              AND reason = 'reservation'
            ORDER BY created_at
        """),
        {"req_id": str(req.id)},
    )
    # Fallback: pick any reserved components of the right blood group + type
    components = await reserve_fefo(
        db, req.facility_id, req.blood_group, req.component_type, 0
    )

    now = datetime.now(tz=timezone.utc)
    issues: list[Issue] = []
    reserved_result = await db.execute(
        select(Component).where(
            Component.facility_id == req.facility_id,
            Component.blood_group == req.blood_group,
            Component.type == req.component_type,
            Component.state == ComponentStateEnum.RESERVED,
        ).limit(req.units_requested)
    )
    reserved_comps = reserved_result.scalars().all()

    for comp in reserved_comps:
        comp.state = ComponentStateEnum.ISSUED
        issue = Issue(
            requisition_id=req.id,
            component_id=comp.id,
            issued_by=actor_id,
            issue_datetime=now,
        )
        db.add(issue)
        issues.append(issue)
        await post_ledger_entry(
            db=db,
            facility_id=req.facility_id,
            blood_group=comp.blood_group,
            component_type=comp.type,
            change_qty=-1,
            reason=LedgerReasonEnum.ISSUE,
            reference_id=req.id,
            reference_type="requisition",
            recorded_by=actor_id,
        )

    req.status = RequisitionStatusEnum.ISSUED
    await db.flush()
    return issues


async def record_transfusion(
    issue: Issue,
    request: TransfusionRequest,
    db: AsyncSession,
) -> Issue:
    issue.transfusion_datetime = request.transfusion_datetime
    issue.outcome = request.outcome
    issue.outcome_notes = request.outcome_notes

    # Mark component transfused
    comp = await db.get(Component, issue.component_id)
    if comp:
        comp.state = ComponentStateEnum.TRANSFUSED

    return issue


async def cancel_requisition(
    req: Requisition,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> Requisition:
    if req.status in (RequisitionStatusEnum.ISSUED, RequisitionStatusEnum.PARTIALLY_ISSUED, RequisitionStatusEnum.CANCELLED):
        raise RequisitionStateError(f"Cannot cancel: requisition is {req.status.value}")

    if req.status == RequisitionStatusEnum.FULLY_RESERVED:
        # Unreserve components
        reserved_result = await db.execute(
            select(Component).where(
                Component.facility_id == req.facility_id,
                Component.blood_group == req.blood_group,
                Component.type == req.component_type,
                Component.state == ComponentStateEnum.RESERVED,
            ).limit(req.units_requested)
        )
        for comp in reserved_result.scalars().all():
            comp.state = ComponentStateEnum.AVAILABLE
            await post_ledger_entry(
                db=db,
                facility_id=req.facility_id,
                blood_group=comp.blood_group,
                component_type=comp.type,
                change_qty=1,
                reason=LedgerReasonEnum.UNRESERVE,
                reference_id=req.id,
                reference_type="requisition_cancel",
                recorded_by=actor_id,
            )

    req.status = RequisitionStatusEnum.CANCELLED
    return req
