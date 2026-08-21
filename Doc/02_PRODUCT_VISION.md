# Product Vision

## Product name

Use a working name such as **Grievance Intelligence & Orchestration Platform (GIOP)** until the team finalizes branding.

## Problem statement framing

The product is **MSC02-centered**: an AI system that categorizes institutional complaints and prioritizes them by urgency and impact. **SMA03's document/email classification and routing capability is integrated as the intake layer** that feeds MSC02 — not a second, separate product. See `PS_TRACEABILITY_MATRIX.md` for the full requirement-to-capability mapping.

Two questions the platform answers, in sequence:

- **SMA03 asks:** "What is this incoming information, and where should it go?"
- **MSC02 asks:** "Which grievances require attention first, and why?"

## One-line value proposition

An AI-assisted institutional grievance operating system that understands incoming complaints from any channel, categorizes and routes them, prioritizes impact, monitors accountability, and closes the feedback loop with students.

## Core modules

1. Multi-Channel Intake Layer (SMA03 capability: Web / Email / Document adapters → canonical complaint object)
2. Student Portal
3. Central Orchestrator
4. AI Understanding Pipeline (SMA03 classification feeding MSC02 categorization)
5. Duplicate/Related Complaint Engine (MSC02)
6. Priority Engine — urgency + impact (MSC02 core)
7. Routing Engine (SMA03 capability, consumed by MSC02 workflow)
8. Department Workspaces
9. SLA & Escalation Engine
10. Notification Service
11. Resolution & Validation Service
12. Archive/Audit Store
13. Analytics and Administration

## Product principles

### Human-in-the-loop

AI proposes classification, priority factors, and routing. Authorized users can override these decisions.

### Explainability

A staff member should be able to answer:

- Why was this complaint routed here?
- Why is its priority high?
- Which complaints were considered related?
- Who changed its status?
- When is the SLA due?

### Privacy by design

Only necessary student data is exposed to departments. Sensitive fields should be role-restricted.

### Configuration over hard-coding

Departments, categories, SLAs, escalation levels, notification templates, and permissions should be configurable.

### Event-driven lifecycle

Important actions produce events such as:

- complaint.created
- complaint.classified
- complaint.related
- complaint.routed
- complaint.assigned
- complaint.escalated
- complaint.resolved
- complaint.validation_requested
- complaint.reopened
- complaint.archived

## Future extensions

- multilingual complaint understanding;
- voice complaint transcription;
- trend forecasting;
- department capacity-aware routing;
- knowledge-base suggestions;
- automated FAQ responses for simple cases;
- campus-wide issue heatmaps;
- policy simulation.
