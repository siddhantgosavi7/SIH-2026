# Master Prompt — Generate the Complete Project Documentation and Implementation Plan

You are a principal software architect, AI systems engineer, product strategist, cybersecurity reviewer, and hackathon mentor.

I am building an institution-wide **AI-assisted student grievance intelligence and orchestration platform** for a hackathon.

The product combines two capabilities:

1. **AI grievance understanding:** classify complaints, identify urgency/impact, detect duplicate or related complaints, and generate an explainable priority score.
2. **Smart intake/routing:** route each complaint to the correct institutional department such as Exam Cell, Hostel, Academics/HOD, or a configurable general grievance authority.

The current concept has these stages:

Student → Login → Dashboard → New Complaint → Central Orchestrator → Normalize → AI Classification → Duplicate/Related Detection → Priority → Routing → Department Queue → Assignment → SLA Monitoring → Resolution → Student Validation → Close/Archive → Analytics.

The system must also support:
- duplicate complaint aggregation;
- affected-user count;
- configurable priority scoring;
- department-specific dashboards;
- role-based access;
- SLA monitoring;
- automatic escalation;
- notifications;
- resolution validation;
- reopen/dispute flow;
- immutable audit history;
- archival;
- cross-department cases;
- human override;
- AI failure fallback;
- analytics for recurring institutional problems.

## Important corrections to preserve

Do NOT design duplicate detection before classification. The preferred order is:

**Normalize → Classify → Duplicate/Related Search → Priority → Route.**

Do NOT permanently delete a complaint when a department resolves it.

Instead:

**Resolve → remove from active department queue → persist resolution centrally → audit → notify student → validate/reopen → archive.**

Do NOT make AI the final authority. AI recommends; policy and authorized humans control final decisions.

Do NOT hard-code a specific institutional hierarchy. Make departments, roles, SLAs, escalation levels, and routing rules configurable.

## What I want you to produce

Create a complete documentation set with separate Markdown files covering:

1. problem statement and real-world pain;
2. product vision and value proposition;
3. actors, roles, permissions and hierarchy;
4. end-to-end architecture;
5. student user flow;
6. complaint lifecycle;
7. AI classification;
8. semantic duplicate/related detection;
9. explainable prioritization;
10. routing engine;
11. departmental architecture;
12. department dashboards;
13. SLA and escalation;
14. resolution, validation and reopening;
15. data model and ERD;
16. API contracts;
17. security, privacy and audit;
18. reliability and observability;
19. technology stack;
20. implementation plan;
21. testing and AI evaluation;
22. analytics and KPIs;
23. risks and trade-offs;
24. hackathon MVP roadmap;
25. demo script;
26. judge Q&A;
27. canonical Mermaid diagrams;
28. implementation checklist.

## Architecture expectations

Prefer a **modular monolith for the hackathon**, with clean boundaries so services can later be extracted.

Suggested components:

- Student Portal
- API/Backend
- Identity/RBAC
- Central Orchestrator
- AI Classification
- Embedding/Semantic Search
- Duplicate/Related Engine
- Priority Engine
- Routing Engine
- Department Queues
- SLA Worker
- Notification Service
- Resolution/Validation Service
- Central Complaint DB
- Audit Log
- Archive
- Analytics

Recommended initial stack:

- React/Next.js + TypeScript;
- FastAPI or NestJS;
- PostgreSQL;
- pgvector where practical;
- background workers;
- provider-agnostic AI adapter.

## AI requirements

Design the AI pipeline so it produces structured output such as:

- category;
- subcategory;
- confidence;
- extracted impact;
- urgency;
- affected-user signal;
- duplicate/related candidates;
- priority factors;
- routing recommendation.

Use explainable policy scoring for the MVP, for example:

Priority =
0.30 Impact +
0.25 Urgency +
0.20 Affected Users +
0.15 SLA Risk +
0.10 Recurrence

Make the weights configurable and clearly state that these are initial policy defaults, not scientifically universal values.

## Duplicate handling

Distinguish:

- DUPLICATE;
- RELATED;
- NEW.

Use embeddings + metadata filters + thresholds.

If uncertain, route to human review.

Never erase individual complaints when they are aggregated.

## Department architecture

Support at least:

- Exam Cell;
- Hostel;
- Academics/HOD.

Use a central complaint registry as the source of truth and department queues as operational projections/workspaces.

Allow cross-department cases with one primary owner and collaborators.

## Student experience

The student should not need to understand internal hierarchy.

They should be able to:

- submit;
- track;
- receive meaningful status updates;
- respond to clarification;
- validate resolution;
- reopen according to policy;
- see historical complaints.

## Judge-winning qualities

The documentation must demonstrate:

- a real institutional problem;
- measurable impact;
- end-to-end closure;
- explainable AI;
- human-in-the-loop;
- privacy;
- accountability;
- SLA enforcement;
- auditability;
- scalability;
- maintainability;
- sustainability;
- data-driven institutional learning.

Avoid buzzword-heavy architecture with no operational purpose.

## Mermaid requirements

Every major flow should include Mermaid diagrams.

Required diagrams:

1. student journey;
2. system architecture;
3. AI pipeline;
4. duplicate/aggregation flow;
5. routing flow;
6. department workflow;
7. SLA escalation;
8. resolution/validation/reopen;
9. data architecture;
10. ER diagram;
11. sequence diagram for complete lifecycle.

Every diagram must have clear labels and no ambiguous infinite loops.

## Judge questions

Include strong, concise answers to:

- Why AI?
- How are duplicates detected?
- What if AI is wrong?
- How is priority calculated?
- Why not delete resolved complaints?
- What happens when a department does nothing?
- How do you protect student data?
- What if the AI provider is unavailable?
- Can this scale?
- How do departments interact?
- How does cross-department routing work?
- What makes this different from a normal complaint portal?
- How will you measure success?
- How does the system improve over time?
- Why is the architecture sustainable?

## Output rules

- Use implementation-ready Markdown.
- Prefer tables for comparisons.
- Use Mermaid for architecture and workflows.
- Include API examples where useful.
- Include data schemas where useful.
- Separate MVP requirements from future enhancements.
- Never invent institutional facts that were not supplied.
- Mark configurable policies clearly.
- Do not claim benchmark accuracy without measured experiments.
- Do not claim compliance certifications unless actually obtained.
- Keep every technical decision tied to a real problem.

## Final product narrative

The strongest narrative should be:

**The student describes a problem once. The system understands it, determines whether it is part of a larger issue, prioritizes its impact, sends it to the right authority, watches the SLA, helps the department close it, asks the student to validate the outcome, preserves the institutional record, and turns repeated complaints into actionable institutional intelligence.**

The result should feel like a real deployable institutional operating system, not a demo form with an AI label.
