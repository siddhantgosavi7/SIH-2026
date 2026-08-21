# Judge Questions and Strong Answers

## How does this project relate to MSC02 and SMA03? Are you solving two problem statements or one?

We identified that SMA03 and MSC02 represent two consecutive stages of the same institutional workflow. SMA03 handles intelligent intake, classification, and routing of incoming information; MSC02 consumes that structured grievance information to categorize it, assess urgency and impact, and prioritize institutional complaints. Rather than building two disconnected applications, we built one unified grievance intelligence platform, centered on MSC02, with SMA03 as its intake layer. See `PS_TRACEABILITY_MATRIX.md` for the exact capability-to-requirement mapping.

## What's the core value proposition?

MSC02's question: *"Which grievances require attention first, and why?"* SMA03 answers a prerequisite question: *"What is this incoming information, and where should it go?"* Together: what is the issue, how important is it, where should it go, how quickly should it be handled, and did the institution actually resolve it.

## Why do you need AI?

AI is useful because complaints are unstructured. Classification and semantic matching help convert free text into structured operational signals. We deliberately keep policy, permissions, and final accountability outside the model.

## How do you detect duplicates?

We use embeddings for semantic retrieval, combined with category and contextual filters. The result is a recommendation with a confidence/similarity score, not an irreversible decision.

## What if AI is wrong?

Low-confidence cases go to human review. Authorized staff can override classification or routing, and the override becomes an auditable event.

## Why not just use one database table?

The central registry is the source of truth, while department queues are operational projections. This gives departments clean workspaces without losing institutional history.

## Why did you change the delete logic?

Deleting resolved complaints would break student history and institutional auditability. We remove resolved work from active queues but retain the central record and archive according to policy.

## How is priority calculated?

The first version uses an explainable weighted policy combining impact, urgency, affected users, SLA risk, and recurrence. The weights are configurable and can later be calibrated from historical outcomes.

## What if ten students report the same problem?

We cluster related complaints, preserve each individual complaint, increase the affected-user signal, and give the department a consolidated operational view.

## What happens if a department does nothing?

The SLA engine detects due-soon and breached states, notifies the responsible authority, escalates according to policy, and records the event.

## Can departments manipulate priority?

Priority changes should be permission-controlled and require a reason. AI and policy scores remain in history.

## What happens if a student disagrees with the resolution?

The student can request reopening according to institutional policy. The old resolution remains in history and the case returns to an active workflow.

## Is this replacing department staff?

No. It removes administrative friction and gives staff better prioritization, context, and accountability.

## Can it scale?

Yes. The logical architecture can start as a modular monolith with PostgreSQL and background workers. High-load components such as AI processing and notifications can later be separated.

## What is the real innovation?

The differentiator is the closed-loop orchestration: **understand → consolidate → prioritize → route → enforce SLA → resolve → validate → learn**. Most basic grievance systems stop at submission and status tracking.
