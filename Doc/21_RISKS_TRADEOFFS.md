# Risks, Trade-offs and Design Decisions

## Risk 1 — AI misclassification

Mitigation:

- confidence threshold;
- human fallback;
- override;
- audit.

## Risk 2 — False duplicate

Mitigation:

- semantic similarity + metadata;
- conservative threshold;
- human confirmation for uncertain cases;
- never delete individual records.

## Risk 3 — Privacy leakage

Mitigation:

- least privilege;
- data minimization;
- redaction;
- access audit.

## Risk 4 — Department bottleneck

Mitigation:

- SLA;
- escalation;
- queue analytics;
- capacity metrics.

## Risk 5 — Notification failure

Mitigation:

- retries;
- delivery status;
- in-app notification fallback.

## Risk 6 — Vendor/API dependency

Mitigation:

- AI adapter;
- mock provider;
- deterministic fallback;
- provider-agnostic interfaces.

## Key trade-off

### Microservices vs modular monolith

Choose modular monolith for the hackathon.

Reason:

- faster delivery;
- simpler deployment;
- easier debugging;
- clear module boundaries;
- can be decomposed later.

## Key trade-off

### Hard-coded priority vs ML priority

Choose explainable policy scoring first.

Reason:

- transparent;
- no large training dataset required;
- easy for judges to understand;
- institution can tune weights;
- historical data can later calibrate the model.

## Key trade-off

### Delete vs archive

Choose archive.

Reason:

- preserves history;
- supports student dashboard;
- enables analytics;
- maintains auditability.
