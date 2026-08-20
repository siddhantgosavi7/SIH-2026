# PS Coverage & Gap Analysis

Coverage is classified honestly using four labels: **FULLY COVERED**, **PARTIALLY COVERED**, **NOT COVERED**, **FUTURE SCOPE**. A capability is only FULLY COVERED if it is actually implemented and demonstrable live — not designed, not planned, not "should work."

Fill in the ✅/⚠️/❌ column as implementation actually proceeds. The status below reflects the **planned hackathon MVP scope** as of this architecture sign-off, before Phase 1 implementation begins — treat it as a target checklist, not a completion report.

## MSC02 — Smart Complaint Prioritization System

| Capability | Target Status | Notes |
|---|---|---|
| Complaint categorization (category + subcategory) | FULLY COVERED (planned) | Core classifier, part of Phase 6 |
| Urgency assessment | FULLY COVERED (planned) | Rule-based sub-score, explainable, Phase 6/8 |
| Impact assessment | FULLY COVERED (planned) | Rule-based sub-score, explainable, Phase 6/8 |
| Duplicate/related complaint detection | FULLY COVERED (planned) | pgvector embeddings + metadata filters, Phase 7 |
| Explainable priority scoring | FULLY COVERED (planned) | Weighted formula with stored reasons, Phase 8 |
| Prioritized department queue | FULLY COVERED (planned) | Department dashboard sorted by priority/SLA, Phase 10 |
| SLA monitoring + escalation | FULLY COVERED (planned) | Phase 12 |
| Resolution + student validation + reopen | FULLY COVERED (planned) | Phase 13–14 |
| Institutional analytics / recurring issue intelligence | PARTIALLY COVERED (planned) | Core metrics yes; predictive/trend forecasting is future scope |
| AI evaluation with measured metrics (not claimed) | PARTIALLY COVERED (planned) | Small labeled eval set (~30–50 pairs) — enough for a credible number, not a rigorous benchmark |

## SMA03 — AI-Based Email and Document Workflow Automation (integrated as intake layer)

| Capability | Target Status | Notes |
|---|---|---|
| Web complaint intake + classification | FULLY COVERED (planned) | Primary demo channel |
| Automatic department routing | FULLY COVERED (planned) | Routing Engine, Phase 9 |
| Email intake adapter | PARTIALLY COVERED (planned) | Recommend implementing as a **simulated adapter** for the hackathon (e.g., a seeded "incoming email" JSON payload run through the same canonicalization/classification path) rather than a live SMTP/IMAP integration, to avoid unreliable live-demo dependencies |
| PDF document intake adapter | PARTIALLY COVERED (planned) | Implement text extraction for a typed PDF; demonstrate on one real file |
| Scanned document / OCR intake adapter | NOT COVERED (hackathon) / FUTURE SCOPE | OCR pipelines are non-trivial to make reliable in hackathon time; do not claim this is built unless actually integrated and tested |
| General "future channels" (WhatsApp, SMS intake, etc.) | FUTURE SCOPE | Explicitly roadmap, not MVP |
| Canonical complaint object across channels | FULLY COVERED (planned) | This is the architectural join point between SMA03 and MSC02 — build this regardless of how many channels are live, since it's what proves the "one platform" claim |

## Why this matters for judges

Judges evaluating against two problem statements will specifically probe: *"Did you actually build the document/email classification, or just say you did?"* Being precise here — e.g., "email intake is a simulated adapter feeding the same canonical pipeline as web intake, and OCR is future scope" — is more credible than overclaiming and getting caught in Q&A. The **canonical complaint object** is the one piece of SMA03 infrastructure that must be real, because it's what makes the "unified platform, not two systems" claim true regardless of how many input channels are live.

## Action items before demo day

- [ ] Decide and lock which channels are live vs. simulated (recommend: Web = live, Email = simulated adapter with a seeded payload, PDF = live if time allows, OCR = not attempted)
- [ ] Make sure `17_DEMO_SCRIPT.md` narration matches this table exactly — do not narrate a capability as live if it's simulated
- [ ] Update this table's status column from "(planned)" to actual pass/fail once each phase is built
