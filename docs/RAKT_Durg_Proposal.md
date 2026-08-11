# RAKT Durg — Digital Blood Bank Platform
### Project Proposal

| | |
|---|---|
| **Prepared for** | Durg District Administration |
| **In collaboration with** | IIT Bhilai (Innovation & Technology Foundation) |
| **Operating facility** | District Hospital & Indian Red Cross Society Blood Bank, Durg |
| **Document** | Proposal v0.1 (Draft) |
| **Date** | August 2026 |

---

## 1. Executive Summary

RAKT Durg is a district-level digital platform that digitizes the end-to-end blood supply chain of the Durg District Hospital and Red Cross–operated Blood Bank — from camp organization and donor screening through unit tracking, requisition, and real-time stock visibility. It is being developed under the guidance of the IIT Bhilai Director and the Durg District Collector, with technical support from the IIT Bhilai Innovation & Technology Foundation.

The platform makes the blood management system **transparent, traceable, and paperless**, gives citizens faster emergency access to blood, and provides the administration with real-time inventory and actionable insight. RAKT Durg is designed to **complement — not duplicate —** India's national e-RaktKosh system (see Section 4).

## 2. Background & Problem Statement

The current process at the district blood bank is largely paper-based:

- Camp permissions, donor screening, and requisitions run on physical registers and forms, creating delays and audit gaps.
- Patients and families searching for blood in an emergency must phone or physically visit the bank to check availability — there is no real-time stock view.
- There is no reliable, unit-level traceability from donor to patient.
- Donor health records and post-donation reports are not systematically returned to the donor.

These gaps cost time in exactly the situations — emergencies — where time matters most, and they weaken the incentive to donate voluntarily.

## 3. Objectives

1. Digitize the full supply chain of the District Hospital + Red Cross blood bank.
2. Give patients, families, and staff **real-time visibility** of blood and component stock.
3. Establish **unit-level, barcode-based traceability** from donor to patient.
4. Make **camp organization, donor screening, and requisition** fully paperless.
5. **Promote voluntary donation** through recognition and a donor engagement mechanism.
6. Give the administration transparent inventory data and actionable insight.

## 4. Positioning & Relationship to e-RaktKosh

India already operates **e-RaktKosh**, the national, centrally-mandated blood bank management system (C-DAC / National Health Mission), which states are directed to use as the single point for donor records and stock reporting. RAKT Durg is **not** a replacement for it.

RAKT Durg is a **district operational and engagement layer** that adds what the national system does not deliver at the last mile, while keeping the statutory record aligned with e-RaktKosh:

| Capability | National e-RaktKosh | RAKT Durg adds |
|---|---|---|
| Donor & stock record of truth | ✔ Statutory record | Syncs / reconciles to it |
| Real-time **district** stock dashboard | Limited | ✔ Live, district-focused, emergency-oriented |
| Digital **camp approval workflow** for local organizers | Basic scheduling | ✔ Calendar blocking, approval, digital coupons |
| **Paperless donor screening** at camp site (offline) | — | ✔ Field capture + barcode issuance |
| **Donor engagement / credit** mechanism | — | ✔ (policy-gated — see Section 10) |
| WhatsApp health-report return to donor | — | ✔ |

**Design principle:** where e-RaktKosh is the system of record, RAKT Durg reconciles to it; where it has gaps, RAKT Durg fills them. Reconciliation mechanism to be confirmed with the State Blood Cell / C-DAC (see TRD).

## 5. Solution Overview — Key Features

1. **Unique barcode-based unit tracking** — every blood bag carries a unique barcode; scanning reveals blood group, component type, test status, expiry, and donor linkage.
2. **Paperless donor screening & medical assessment** — registration, ABHA-based identity verification, vitals/hemoglobin capture, and the medical questionnaire, all digital; barcode issued at collection.
3. **Digital camp management & approval** — organizations apply online, block the calendar, and receive digital approval and coupons without paperwork.
4. **Live stock & real-time dashboard** — group- and component-level availability in real time, plus stock analytics for the administration.
5. **Donor engagement (Blood Credit Wallet)** — recognition and a credit mechanism for repeat voluntary donation (policy-gated; see Section 10).
6. **WhatsApp health reports** — post-donation health report returned to the donor.

## 6. Stakeholders & Benefits

| Stakeholder | Benefit |
|---|---|
| **Patients & families** | Real-time stock at a click in an emergency; no wandering between banks; faster fulfillment. |
| **Blood donors** | Digital donor ID, health-record tracking, post-donation report on WhatsApp, recognition for repeat donation. |
| **Voluntary organizations / camp organizers** | Fast, transparent permission process; full history of units collected. |
| **Health administration** | Freedom from paper registers, error-free inventory, complete donor-to-patient traceability, actionable insight. |

## 7. Scope & Phasing

Delivered in six phases, iteratively, with a pilot at the District Hospital before district-wide rollout:

| Phase | Focus | Rationale |
|---|---|---|
| **P1** | Blood-unit barcode tracking + **live stock dashboard** | Core value, lowest policy risk — deliver first |
| **P2** | Donor management + **paperless screening** (offline camp capture) | Feeds the traceability chain at source |
| **P3** | **Camp management** + digital approval + coupons | Removes the paperwork bottleneck |
| **P4** | **Blood Credit Wallet** (policy-gated, feature-flagged) | Highest-risk feature — built but disabled pending sign-off |
| **P5** | Requisition / emergency fulfillment + WhatsApp/SMS + **e-RaktKosh reconciliation** | Closes the loop with donors and the national system |
| **P6** | Compliance hardening + security review + deployment | DPDP pass, audit, DR, go-live |

## 8. Approach & Indicative Timeline

- **Plan-first, AI-assisted, iterative build.** Requirements are captured in a BRD and TRD (companion documents); the build is executed phase-by-phase with a checkpoint at the end of each phase.
- **Pilot before scale.** Run RAKT Durg alongside the existing process at the District Hospital, validate against real operations, then extend to the district's other collection points.
- Indicative: P1–P2 as the first release (core traceability + screening), P3–P4 as the second, P5–P6 as the third. Firm dates to be set with the IIT Bhilai tech team once the plan is confirmed.

## 9. Governance & Roles

| Role | Responsibility |
|---|---|
| **Sponsors** | District Collector (Durg); Director, IIT Bhilai |
| **Programme oversight** | Dean (R&D), IIT Bhilai |
| **Technical lead** | CTO, IIT Bhilai Innovation & Technology Foundation |
| **Clinical owner** | Blood Bank Medical Officer / Transfusion Medicine (must sign off on clinical & wallet rules) |
| **Business / requirements** | Business Architect (BRD/TRD owner) |
| **Delivery** | Development team (build), QA, deployment |

> **Note:** a named **clinical owner** is essential — the barcode→unit lifecycle carries patient-safety weight (lookback/recall on transfusion reactions), and the wallet rules require medical-legal validation.

## 10. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Blood Credit Wallet may be read as incentivized/replacement donation.** Voluntary donation in India is meant to be non-remunerated; a "donate now → free blood later" mechanic is a policy risk. | Design it, but **feature-flag it off** until the Blood Bank Medical Officer and legal confirm compliance with NBTC/SBTC guidance. Not on the critical path. |
| **Data protection (DPDP Rules 2025 + Aadhaar).** Health data and identity are sensitive; 2026 is the DPDP build/test window ahead of enforcement. | Consent capture, purpose limitation, retention/deletion; **do not store raw Aadhaar** — authenticate via ABHA and keep a reference; full audit trail; India-region hosting. |
| **e-RaktKosh alignment.** Duplicating or diverging from the statutory record. | Explicit reconciliation design; confirm integration channel with State Blood Cell / C-DAC. |
| **Connectivity at camp sites.** Field locations have poor connectivity but must capture data and issue barcodes. | **Offline-first** capture with sync and conflict handling. |
| **Adoption.** Staff and organizers accustomed to paper. | Pilot + training; run in parallel before cutover; bilingual (Hindi/English) UI. |

## 11. Success Metrics

- % of units tracked end-to-end (donor → patient) via barcode.
- Camp-permission turnaround time (days → hours).
- Stock-record accuracy vs physical count.
- Emergency requisition fulfillment time.
- Repeat voluntary donor rate.

## 12. Next Steps

1. Confirm this proposal and the companion BRD/TRD with sponsors and the clinical owner.
2. Confirm reference technology stack and hosting with the IIT Bhilai tech team.
3. Confirm e-RaktKosh reconciliation channel with the State Blood Cell.
4. Initiate the Phase-1 build (plan-first) and stand up the pilot at the District Hospital.
