# PS Coverage & Gap Analysis

Coverage is classified honestly using four labels: **FULLY COVERED**, **PARTIALLY COVERED**, **NOT COVERED**, **FUTURE SCOPE**. A capability is only FULLY COVERED if it is actually implemented and demonstrable live — not designed, not planned, not "should work."

The status below was verified against the canonical root stack on 23 August 2026. The target architecture remains documented separately; these statuses describe the current implementation, not planned work.

## MSC02 — Smart Complaint Prioritization System

| Capability | Target Status | Notes |
|---|---|---|
| Complaint categorization (category + subcategory) | PARTIALLY COVERED | Deterministic priority/duplicate processing; no model-backed category/subcategory classifier. |
| Urgency assessment | PARTIALLY COVERED | Deterministic keyword priority rules; no configured policy history. |
| Impact assessment | NOT COVERED | No affected-user or service-impact input model. |
| Duplicate/related complaint detection | PARTIALLY COVERED | pgvector table and deterministic demo vector; no approved embedding provider. |
| Explainable priority scoring | PARTIALLY COVERED | Priority is stored; factor explanation is not exposed. |
| Prioritized department queue | PARTIALLY COVERED | Server-side staff department scope and queue statistics; live web queue needs Compose verification. |
| SLA monitoring + escalation | FULLY COVERED | One-worker ticker escalates overdue complaints and writes persisted notifications. |
| Resolution + student validation + reopen | PARTIALLY COVERED | Persistent, authorized status transitions; no dedicated student validation/reopen endpoint. |
| Institutional analytics / recurring issue intelligence | PARTIALLY COVERED | Department status counters only; no trend/forecasting pipeline. |
| AI evaluation with measured metrics (not claimed) | PARTIALLY COVERED | Small JSONL fixtures tracked; no automated metric report. |

## SMA03 — AI-Based Email and Document Workflow Automation (integrated as intake layer)

| Capability | Target Status | Notes |
|---|---|---|
| Web complaint intake + classification | PARTIALLY COVERED | Web form and API exist; live Compose integration remains unverified. |
| Automatic department routing | NOT COVERED | Department is supplied by intake; no routing policy engine. |
| Email intake adapter | PARTIALLY COVERED | Authenticated API endpoint exists; no mailbox polling/webhook. |
| PDF document intake adapter | PARTIALLY COVERED | Authenticated PDF upload endpoint stores document; text extraction is absent. |
| Scanned document / OCR intake adapter | NOT COVERED (hackathon) / FUTURE SCOPE | OCR pipelines are non-trivial to make reliable in hackathon time; do not claim this is built unless actually integrated and tested |
| General "future channels" (WhatsApp, SMS intake, etc.) | FUTURE SCOPE | Explicitly roadmap, not MVP |
| Canonical complaint object across channels | PARTIALLY COVERED | Web/email share `ComplaintCreate`; PDF creates a stored complaint but does not extract content. |

## Why this matters for judges

Judges evaluating against two problem statements will specifically probe: *"Did you actually build the document/email classification, or just say you did?"* Being precise here — e.g., "email intake is a simulated adapter feeding the same canonical pipeline as web intake, and OCR is future scope" — is more credible than overclaiming and getting caught in Q&A. The **canonical complaint object** is the one piece of SMA03 infrastructure that must be real, because it's what makes the "unified platform, not two systems" claim true regardless of how many input channels are live.

## Action items before demo day

- [x] Decide and lock which channels are live vs. simulated (Web/API email/PDF = live API paths; OCR = not implemented)
- [x] Make sure `17_DEMO_SCRIPT.md` narration matches this table exactly
- [x] Update this table's status column from "(planned)" to actual repository-backed status
