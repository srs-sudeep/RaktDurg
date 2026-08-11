# RAKT Durg — Digital Blood Bank Platform
### Business Requirements Document (BRD)

| | |
|---|---|
| **Document** | BRD v0.1 (Draft) |
| **Author** | Business Architect |
| **Sponsors** | District Collector (Durg); Director, IIT Bhilai |
| **Approvers** | Sponsors, Blood Bank Medical Officer (clinical), CTO (technical) |
| **References** | RAKT Durg Proposal v0.1; RAKT Durg TRD v0.1; e-RaktKosh (NHM/C-DAC); NBTC/SBTC guidelines; Drugs & Cosmetics Act & Rules; DPDP Act 2023 + Rules 2025; ABDM/ABHA |

---

## 1. Purpose & Scope

This BRD defines the **business requirements** for RAKT Durg — a district-level digital platform that digitizes the blood supply chain of the Durg District Hospital & Red Cross Blood Bank. It describes the current and future business processes, the functional requirements by module, the business rules, and the compliance obligations. It is the source for the companion **Technical Requirements Document (TRD)**.

**In scope:** donor screening, blood-unit/inventory tracking, camp management, requisition/fulfillment, live stock dashboard, donor engagement (wallet), notifications, and reconciliation with e-RaktKosh.

**Out of scope:** see Section 14.

## 2. Business Objectives & Success Criteria

| # | Objective | Success measure |
|---|---|---|
| O1 | End-to-end unit traceability | % units tracked donor→patient |
| O2 | Real-time stock visibility | Stock accuracy vs physical count; dashboard uptime |
| O3 | Paperless screening & camps | % camps and screenings completed digitally |
| O4 | Faster emergency access | Requisition fulfillment time |
| O5 | Promote voluntary donation | Repeat donor rate |
| O6 | Transparent administration | Availability of audit trail & analytics |

## 3. Stakeholders

| Stakeholder | Interest / role |
|---|---|
| District Administration (sponsor) | Programme approval, oversight, outcomes |
| IIT Bhilai I&TF (technical) | Build, deploy, maintain |
| Blood Bank Medical Officer (clinical owner) | Clinical rules, screening protocol, wallet policy sign-off, patient safety |
| Blood bank staff (phlebotomist, lab tech, inventory officer) | Day-to-day operators |
| Donors | Register, donate, receive report/recognition |
| Camp organizers (NGOs, colleges, industry) | Apply for and run camps |
| Patients & families | Request/receive blood in emergencies |

## 4. Current State (As-Is)

- **Camp permission:** organizers apply on paper; approval is manual and slow.
- **Donor screening:** paper registration + 2-page medical questionnaire; vitals/hemoglobin recorded on paper.
- **Unit handling:** manual labelling; no consistent unique-ID barcode; traceability via registers.
- **Stock:** maintained in registers; no real-time external view; patients phone/visit to check.
- **Requisition:** manual; emergency access depends on phone calls and physical presence.
- **Donor follow-up:** health reports not systematically returned to donors.

## 5. Future State (To-Be)

A single digital platform where: organizers apply and get approval online; donors are screened digitally at the camp with a barcode issued at collection; every unit is tracked by unique barcode through testing, component separation, storage, issue, and transfusion; stock is visible in real time; requisitions are digital; and donors receive their health report (and recognition) automatically. The statutory record stays aligned with e-RaktKosh.

## 6. Business Process Scope (Modules)

M1 Donor Management & Screening · M2 Blood Unit & Inventory Tracking · M3 Camp Management & Approval · M4 Requisition & Emergency Fulfillment · M5 Live Stock Dashboard & Analytics · M6 Donor Engagement (Blood Credit Wallet) · M7 Notifications · M8 Administration & Master Data.

## 7. Functional / Business Requirements

> Priority: **M** = MVP (Phase 1–2), **H** = High, **M-L** = Medium/Later. IDs are stable references for the TRD and build.

### M1 — Donor Management & Screening
| ID | Requirement | Priority |
|---|---|---|
| BR-DON-01 | Register a donor with demographics and contact number. | M |
| BR-DON-02 | Verify donor identity via **ABHA** (Aadhaar authenticated, not stored raw). | H |
| BR-DON-03 | Capture vitals and hemoglobin at the screening station. | M |
| BR-DON-04 | Complete the medical questionnaire digitally (paperless), replacing the 2-page form. | M |
| BR-DON-05 | Apply eligibility/deferral rules and flag ineligible donors with reason. | H |
| BR-DON-06 | Issue a **unique barcode** at collection, linked to the donor and donation. | M |
| BR-DON-07 | Maintain a donor health-record history viewable by the donor. | H |
| BR-DON-08 | Support **offline** capture at camp sites with later sync. | M |

### M2 — Blood Unit & Inventory Tracking
| ID | Requirement | Priority |
|---|---|---|
| BR-UNIT-01 | Assign a unique barcode/ID to every blood bag. | M |
| BR-UNIT-02 | On scan, show blood group, component type, test status, expiry, donor linkage. | M |
| BR-UNIT-03 | Record unit lifecycle states (collected → tested → separated → stored → reserved → issued → transfused / discarded / expired). | M |
| BR-UNIT-04 | Record TTI/test results and release status per unit. | H |
| BR-UNIT-05 | Track components (Whole Blood, PRBC, Platelets, FFP) derived from a unit. | M |
| BR-UNIT-06 | Enforce expiry and support **FEFO** issue (first-expiry-first-out). | H |
| BR-UNIT-07 | Support **lookback/recall** — trace all units/components from a donor or a flagged result. | H |

### M3 — Camp Management & Approval
| ID | Requirement | Priority |
|---|---|---|
| BR-CAMP-01 | Organizer submits an online camp application. | H |
| BR-CAMP-02 | Block/reserve a date on the shared calendar. | H |
| BR-CAMP-03 | Digital approval workflow (submit → review → approve/reject with reason). | H |
| BR-CAMP-04 | Issue digital coupons on approval. | H |
| BR-CAMP-05 | Organizer views history of units collected across their camps. | H |
| BR-CAMP-06 | Link screened donors and issued units to the camp. | M |

### M4 — Requisition & Emergency Fulfillment
| ID | Requirement | Priority |
|---|---|---|
| BR-REQ-01 | Raise a blood/component requisition against a patient. | H |
| BR-REQ-02 | Check live availability and reserve units. | H |
| BR-REQ-03 | Record issue and link to requisition (traceability). | H |
| BR-REQ-04 | Prioritize emergency requisitions. | M-L |

### M5 — Live Stock Dashboard & Analytics
| ID | Requirement | Priority |
|---|---|---|
| BR-DASH-01 | Real-time stock by blood group and component. | M |
| BR-DASH-02 | Public/citizen view of availability (read-only). | H |
| BR-DASH-03 | Administration analytics: collection vs demand, expiry/wastage, camp yield. | H |
| BR-DASH-04 | Low-stock and near-expiry alerts. | H |

### M6 — Donor Engagement (Blood Credit Wallet) — *policy-gated*
| ID | Requirement | Priority |
|---|---|---|
| BR-WAL-01 | Credit a donor's wallet on each verified donation. | M-L |
| BR-WAL-02 | Allow redemption toward blood for self/family (subject to availability & rules). | M-L |
| BR-WAL-03 | Link family members eligible to redeem. | M-L |
| BR-WAL-04 | Apply credit expiry and audit every transaction. | M-L |
| BR-WAL-05 | **Feature flag**: wallet disabled in production until clinical/legal sign-off. | M-L |

### M7 — Notifications
| ID | Requirement | Priority |
|---|---|---|
| BR-NOT-01 | Send post-donation health report via WhatsApp. | H |
| BR-NOT-02 | SMS/WhatsApp for camp approval, coupon, requisition status. | H |

### M8 — Administration & Master Data
| ID | Requirement | Priority |
|---|---|---|
| BR-ADM-01 | Manage users and **role-based access** (staff roles, organizer, admin). | M |
| BR-ADM-02 | Manage master data (facilities, blood groups, components, test panels, deferral reasons). | M |
| BR-ADM-03 | Maintain a full **audit trail** of unit state changes and PII access. | M |
| BR-ADM-04 | Reconcile / export donor and stock records to **e-RaktKosh**. | H |

## 8. Business Rules

- **BRULE-01 (Eligibility):** enforce minimum donation interval and deferral criteria (age, weight, hemoglobin threshold, recent illness, etc.) per the clinical protocol confirmed by the Medical Officer.
- **BRULE-02 (FEFO):** on issue, propose the earliest-expiry compatible unit first.
- **BRULE-03 (Release gating):** a unit cannot be issued until testing is complete and it is marked released.
- **BRULE-04 (Traceability):** every unit/component must be traceable to a donor and to any patient it was issued/transfused to.
- **BRULE-05 (Camp approval):** a camp date cannot be confirmed without approval; coupons are issued only on approval.
- **BRULE-06 (Wallet — pending sign-off):** credit/redemption rules (earn ratio, redemption eligibility, family linkage, expiry) **must not be enabled in production until validated by the Blood Bank Medical Officer and legal** against NBTC/SBTC voluntary-donation guidance.
- **BRULE-07 (Access):** access to donor PII and health records is role-restricted and logged.
- **BRULE-08 (Consent):** donor consent for data processing is captured at registration; purpose is limited to blood services.

## 9. Data Requirements (business view)

Key business data entities (technical model in the TRD): **Donor**, **Donor Health Record / Screening**, **Blood Unit**, **Component**, **Camp** and **Camp Registration**, **Requisition**, **Wallet Account & Transactions**, **Stock Ledger**, **Facility**, **User & Role**, **Audit Log**.

## 10. Reporting Requirements

Real-time stock; collection vs demand; expiry/wastage; camp-wise yield; donor repeat rate; requisition turnaround; audit/traceability reports for regulators.

## 11. Non-Functional Requirements (business view)

- **Availability:** dashboard and requisition must be reliably available (emergency use).
- **Usability:** bilingual **Hindi/English** UI; simple enough for field and counter staff.
- **Offline:** camp-site screening and barcode issuance must work without connectivity, then sync.
- **Security & privacy:** health/identity data protected; access logged (see Section 12).

## 12. Compliance & Regulatory Requirements

- **Blood transfusion regulation:** operate consistently with the Drugs & Cosmetics Act & Rules and NBTC/SBTC guidance; traceability and audit are **regulatory requirements**, not optional.
- **DPDP Act 2023 + Rules 2025:** health data is protected personal data; the district hospital is a data fiduciary. Requires consent, purpose limitation, retention/deletion, breach handling.
- **Aadhaar/ABDM:** use **ABHA** for identity; **do not store raw Aadhaar** — authenticate and keep a reference. India-region data residency.
- **Wallet policy:** subject to voluntary/non-remunerated donation principles (BRULE-06).

## 13. Assumptions, Constraints & Dependencies

- **Assumptions:** district hospital + Red Cross bank operate as the initial site; a clinical owner is available to confirm protocols.
- **Constraints:** camp connectivity; hardware availability (barcode printers/scanners, hemoglobin devices); DPDP compliance timeline.
- **Dependencies:** e-RaktKosh reconciliation channel (State Blood Cell / C-DAC); ABDM production access; WhatsApp Business API approval; hosting decision (govt cloud).

## 14. Out of Scope (initial release)

Cross-district / state-wide rollout; hospital HIS/LIS deep integration; automated integration with hemoglobin/analyzer hardware (manual entry acceptable initially); financial billing beyond wallet.

## 15. Acceptance Criteria (business)

- A blood unit can be traced end-to-end via its barcode (BR-UNIT-02/03, BR-REQ-03).
- Live stock is visible and accurate vs physical count (BR-DASH-01/02).
- A donor can be screened digitally and issued a barcode offline at a camp (M1 offline path).
- A camp can be applied for, approved, and coupons issued digitally (M3).
- All unit state changes and PII access are recorded in the audit log (BR-ADM-03).
- Wallet remains disabled in production pending sign-off (BR-WAL-05 / BRULE-06).
