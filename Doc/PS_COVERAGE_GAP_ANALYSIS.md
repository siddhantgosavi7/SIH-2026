# PS Coverage & Gap Analysis

Coverage is classified honestly using four labels: **FULLY COVERED**, **PARTIALLY COVERED**, **NOT COVERED**, **FUTURE SCOPE**. A capability is only FULLY COVERED if it is actually implemented and demonstrable live — not designed, not planned, not "should work."

The status below was verified against the repository on 22 August 2026. The target architecture remains documented separately; these statuses describe the current implementation, not planned work.

## MSC02 — Smart Complaint Prioritization System

| Capability | Target Status | Notes |
|---|---|---|
| Complaint categorization (category + subcategory) | PARTIALLY COVERED | Deterministic keyword classifier; no external model adapter. |
| Urgency assessment | PARTIALLY COVERED | Explainable rule signal exists in the demo priority function; no persisted factor history. |
| Impact assessment | PARTIALLY COVERED | Affected-user and service/safety signals exist; no production policy configuration. |
| Duplicate/related complaint detection | PARTIALLY COVERED | Lexical overlap clustering only; no embeddings/pgvector or explicit relation type. |
| Explainable priority scoring | PARTIALLY COVERED | Weighted score and reasons returned by API; no persistent priority history. |
| Prioritized department queue | PARTIALLY COVERED | API queue projection exists; no authorized department dashboard. |
| SLA monitoring + escalation | NOT COVERED | Due timestamp is calculated, but no worker, escalation, or notifications exist. |
| Resolution + student validation + reopen | PARTIALLY COVERED | API state machine exists in memory; no auth or persistent lifecycle. |
| Institutional analytics / recurring issue intelligence | PARTIALLY COVERED | Basic API counters only; no dashboard, trend pipeline, or forecasting. |
| AI evaluation with measured metrics (not claimed) | NOT COVERED | No labeled dataset or evaluation test is tracked. |

## SMA03 — AI-Based Email and Document Workflow Automation (integrated as intake layer)

| Capability | Target Status | Notes |
|---|---|---|
| Web complaint intake + classification | PARTIALLY COVERED | Live web form calls the API; the dashboard activity cards remain illustrative. |
| Automatic department routing | PARTIALLY COVERED | Three mappings exist in code; no policy tables or staff authorization. |
| Email intake adapter | NOT COVERED | No email endpoint or simulated adapter exists. |
| PDF document intake adapter | NOT COVERED | No document upload or extraction endpoint exists. |
| Scanned document / OCR intake adapter | NOT COVERED (hackathon) / FUTURE SCOPE | OCR pipelines are non-trivial to make reliable in hackathon time; do not claim this is built unless actually integrated and tested |
| General "future channels" (WhatsApp, SMS intake, etc.) | FUTURE SCOPE | Explicitly roadmap, not MVP |
| Canonical complaint object across channels | NOT COVERED | `ComplaintCreate` exists for web JSON only; no multi-channel adapter contract is implemented. |

## Why this matters for judges

Judges evaluating against two problem statements will specifically probe: *"Did you actually build the document/email classification, or just say you did?"* Being precise here — e.g., "email intake is a simulated adapter feeding the same canonical pipeline as web intake, and OCR is future scope" — is more credible than overclaiming and getting caught in Q&A. The **canonical complaint object** is the one piece of SMA03 infrastructure that must be real, because it's what makes the "unified platform, not two systems" claim true regardless of how many input channels are live.

## Action items before demo day

- [x] Decide and lock which channels are live vs. simulated (Web = live; Email/PDF/OCR = not implemented)
- [x] Make sure `17_DEMO_SCRIPT.md` narration matches this table exactly
- [x] Update this table's status column from "(planned)" to actual repository-backed status
