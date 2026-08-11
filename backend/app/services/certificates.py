from __future__ import annotations

import uuid
from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.donor import Donation, DonationCertificate, Donor


class CertificateError(Exception):
    pass


async def _next_certificate_number(db: AsyncSession, year: int) -> str:
    prefix = f"DDBC-{year}-"
    result = await db.execute(
        select(func.count())
        .select_from(DonationCertificate)
        .where(DonationCertificate.certificate_number.like(f"{prefix}%"))
    )
    seq = int(result.scalar_one()) + 1
    return f"{prefix}{seq:05d}"


async def issue_certificate_for_donation(
    donation: Donation,
    db: AsyncSession,
) -> DonationCertificate:
    existing = await db.execute(
        select(DonationCertificate).where(DonationCertificate.donation_id == donation.id)
    )
    cert = existing.scalar_one_or_none()
    if cert is not None:
        return cert

    donor = await db.get(Donor, donation.donor_id)
    if donor is None:
        raise CertificateError("Donor not found for donation")

    donation_date = donation.collection_datetime.date()
    blood_group = donor.blood_group.value if donor.blood_group else None
    number = await _next_certificate_number(db, donation_date.year)
    cert = DonationCertificate(
        donation_id=donation.id,
        donor_id=donation.donor_id,
        facility_id=donation.facility_id,
        certificate_number=number,
        donor_name=donor.name,
        blood_group=blood_group,
        donation_date=donation_date,
        volume_ml=donation.volume_ml,
        issued_at=datetime.now(tz=timezone.utc),
    )
    db.add(cert)
    await db.flush()
    return cert


async def list_certificates_for_donor(
    donor_id: uuid.UUID,
    db: AsyncSession,
) -> list[DonationCertificate]:
    # Ensure every donation has a certificate row (lazy issue).
    donations = (
        await db.execute(
            select(Donation)
            .where(Donation.donor_id == donor_id)
            .order_by(Donation.collection_datetime.desc())
        )
    ).scalars().all()
    for donation in donations:
        await issue_certificate_for_donation(donation, db)

    rows = (
        await db.execute(
            select(DonationCertificate)
            .where(DonationCertificate.donor_id == donor_id)
            .order_by(DonationCertificate.donation_date.desc())
        )
    ).scalars().all()
    return list(rows)


async def get_certificate(
    certificate_id: uuid.UUID,
    db: AsyncSession,
) -> DonationCertificate:
    cert = await db.get(DonationCertificate, certificate_id)
    if cert is None:
        raise CertificateError("Certificate not found")
    return cert


def render_certificate_pdf(cert: DonationCertificate) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Border
    margin = 18 * mm
    c.setStrokeColorRGB(0.55, 0.05, 0.1)
    c.setLineWidth(2)
    c.rect(margin, margin, width - 2 * margin, height - 2 * margin)

    y = height - 40 * mm
    c.setFillColorRGB(0.55, 0.05, 0.1)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "Indian Red Cross Society")
    y -= 8 * mm
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width / 2, y, "Durg District Blood Center")
    y -= 6 * mm
    c.setFont("Helvetica", 11)
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawCentredString(width / 2, y, "District Hospital Durg (C.G.)")

    y -= 18 * mm
    c.setFillColorRGB(0.55, 0.05, 0.1)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, y, "Certificate of Blood Donation")

    y -= 16 * mm
    c.setFillColorRGB(0.15, 0.15, 0.15)
    c.setFont("Helvetica", 12)
    c.drawCentredString(
        width / 2,
        y,
        "This is to certify that the following donor has voluntarily donated blood.",
    )

    y -= 18 * mm
    left = 45 * mm

    def row(label: str, value: str) -> None:
        nonlocal y
        c.setFont("Helvetica-Bold", 11)
        c.drawString(left, y, label)
        c.setFont("Helvetica", 11)
        c.drawString(left + 55 * mm, y, value)
        y -= 9 * mm

    row("Certificate No.", cert.certificate_number)
    row("Donor Name", cert.donor_name)
    row("Blood Group", cert.blood_group or "—")
    row("Donation Date", cert.donation_date.isoformat())
    row("Volume", f"{cert.volume_ml} ml" if cert.volume_ml else "—")
    row("Issued On", cert.issued_at.date().isoformat())

    y -= 20 * mm
    c.setFont("Helvetica", 10)
    c.drawString(left, y, "Facility stamp / Authorized signatory")
    c.line(left, y - 2 * mm, left + 70 * mm, y - 2 * mm)

    y = 35 * mm
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawCentredString(
        width / 2,
        y,
        "Thank you for saving lives. Your donation strengthens the district blood supply.",
    )

    c.showPage()
    c.save()
    return buffer.getvalue()
