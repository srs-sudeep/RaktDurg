---
id: nbtc
title: NBTC Guidelines
---

# NBTC Guidelines

RAKT Durg follows the **National Blood Transfusion Council (NBTC)** guidelines for blood bank management in India.

## Donor Eligibility

### Standard Eligibility Criteria (NBTC)

| Parameter | NBTC Standard | RAKT Durg Implementation |
|-----------|--------------|--------------------------|
| Age | 18 – 65 years | `eligibility.py` rule 1 |
| Weight | ≥ 45 kg | `eligibility.py` rule 2 |
| Haemoglobin | ≥ 12.5 g/dL (male), ≥ 12.0 g/dL (female) | Simplified to ≥ 12.5 g/dL |
| Blood pressure (systolic) | 90 – 160 mmHg | `eligibility.py` rule 4 |
| Blood pressure (diastolic) | 50 – 100 mmHg | `eligibility.py` rule 4 |
| Pulse | 50 – 100 bpm | `eligibility.py` rule 5 |
| Temperature | ≤ 37.5 °C | `eligibility.py` rule 6 |
| Donation interval | ≥ 90 days | `eligibility.py` rule 12 |

### Permanent Deferrals

| Condition | Basis |
|-----------|-------|
| STI history | Permanent deferral per NBTC |

### Temporary Deferrals

| Condition | Period | Basis |
|-----------|--------|-------|
| Pregnancy | Duration + 6 months | NBTC |
| Recent illness | 7 days | NBTC |
| Recent surgery | 6 months | NBTC |
| Tattoo/piercing | 12 months | NBTC |

## Mandatory Test Panels

NBTC requires all donated blood to be tested for:

| Panel | Full Name |
|-------|-----------|
| HIV | HIV 1 & 2 |
| HBsAg | Hepatitis B Surface Antigen |
| HCV | Hepatitis C Virus |
| Malaria | Malaria Parasite (MPPT) |
| VDRL | Syphilis (Venereal Disease Research Laboratory) |

RAKT Durg enforces that all 5 panels must be recorded before a unit can be released (`release_status = "approved"`).

## Component Labelling

Blood unit barcodes follow a format compatible with ISBT 128:
- Facility code encoded
- Sequential numbering with check digit
- 15-character format for compact labelling

## Record Retention

NBTC recommends blood bank records be retained for a minimum of **7 years** from the date of the last transaction. RAKT Durg's audit log is append-only and records are not deleted.

## e-RaktKosh Integration

NBTC mandates daily reporting to the national e-RaktKosh system. RAKT Durg implements this via:

1. Daily Celery task at 23:50
2. Exports donation count + available inventory
3. Sends to e-RaktKosh endpoint (mocked in dev)

Manual export available via admin API for corrective submissions.

## ABHA Integration

Identity verification follows the **Ayushman Bharat Health Account (ABHA)** standard:
- No raw 14-digit ABHA number stored
- Only verified references stored
- Verification delegated to ABHA adapter
