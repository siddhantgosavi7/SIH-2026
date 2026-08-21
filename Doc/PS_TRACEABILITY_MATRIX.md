# PS Traceability Matrix

## Positioning

This platform is built around **one primary problem statement**, with a second problem statement integrated as an upstream capability — not as a second product.

- **MSC02 (core):** "Develop an AI-based system that categorizes institutional complaints and prioritizes them according to urgency and impact."
- **SMA03 (integrated intake capability):** "Develop a system that automatically classifies incoming documents and routes them to appropriate departments."

SMA03 is implemented as the **intelligent intake, classification, and routing layer** that feeds structured, canonical grievance data into the MSC02 prioritization pipeline. There is one platform, one data model, one lifecycle — not two systems bolted together.

## Traceability matrix

| Requirement | PS | System Capability | Architecture Component | Demo Evidence |
|---|---|---|---|---|
| Categorize institutional complaints | MSC02 | AI Complaint Classification (category + subcategory) | AI Pipeline — `ai/classifier.py` | Complaint shown with category/subcategory + confidence |
| Assess urgency | MSC02 | Urgency sub-score (deadline proximity, immediacy keywords) | Priority Engine | Priority breakdown showing urgency factor |
| Assess impact | MSC02 | Impact sub-score (service criticality, safety, affected users) | Priority Engine | Priority breakdown showing impact factor |
| Prioritize complaints | MSC02 | Weighted, explainable Priority Score (0–100) | Priority Engine | "Priority 86/100 — High" with reasons list |
| Detect duplicate/related complaints | MSC02 | Embedding similarity + metadata filtering | Duplicate/Related Engine (pgvector) | Second complaint linked into existing cluster live |
| Intelligent grievance processing (end-to-end) | MSC02 | Central Orchestrator + state machine | Orchestrator | Full lifecycle demo, submission → archive |
| Actionable prioritized complaint management | MSC02 | Department dashboard sorted/filtered by priority, SLA, cluster | Department Queue UI | Dashboard screenshot/live view |
| Classify incoming documents/content | SMA03 | Content classification on web text (and, where implemented, email/PDF/scan input) | Intake Adapter Layer → AI Classifier | Complaint submitted via a non-web channel, correctly classified |
| Extract structured content from documents | SMA03 | Text extraction / OCR adapter | Document Adapter, OCR Adapter | PDF or scanned complaint converted to canonical text |
| Route to appropriate department | SMA03 | Routing Engine consuming SMA03 classification output | Routing Engine | Complaint automatically appears in correct department queue |
| Multi-channel intake | SMA03 | Web / Email / Document adapters normalizing to one canonical object | Input Adapter Layer → `CanonicalComplaintInput` | At least two channels demonstrated feeding the same pipeline |
| Institutional grievance lifecycle after routing | MSC02 | SLA, escalation, resolution, validation, analytics | SLA Worker, Resolution Service, Analytics | Full downstream flow after SMA03 hands off |

## How SMA03 and MSC02 connect (traceable example)

```text
Incoming email
  → SMA03: Email Adapter extracts text, attachments, sender
  → SMA03: Content Classification → "Hostel / Water Supply"
  → SMA03: Routing recommendation → Hostel Department
  → MSC02: Urgency + Impact assessment
  → MSC02: Duplicate/related check against existing complaints
  → MSC02: Priority score calculated (increases if related complaints exist)
  → MSC02: Routed to Hostel queue, SLA clock starts
  → MSC02: Escalation if breached
  → MSC02: Resolution → Student validation
  → MSC02: Analytics — recurring issue intelligence
```

Every capability that exists because of SMA03 (extraction, channel adapters, initial classification) has a single, traceable purpose: producing a `CanonicalComplaintInput` that MSC02's prioritization pipeline consumes. No SMA03 capability exists as a standalone feature disconnected from the MSC02 workflow.

## How to keep this matrix honest

- Do not mark a row "demoed" unless the demo script (`17_DEMO_SCRIPT.md`) actually exercises it live.
- If a channel (e.g., email, scanned PDF) is implemented as a mock/simulated adapter for the hackathon rather than a live integration, say so explicitly in the demo narration and in `PS_COVERAGE_GAP_ANALYSIS.md` — do not imply a live email inbox integration if it isn't one.
