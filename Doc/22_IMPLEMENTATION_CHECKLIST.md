# Implementation Checklist

Status legend: `[x]` implemented and present in the repository, `[~]` partial/demo-only, `[ ]` not implemented. This checklist is intentionally honest; architecture documentation is not evidence of a completed feature.

## Foundation

- [x] Create repository structure
- [~] Configure environment variables
- [~] Set up PostgreSQL
- [ ] Create migrations
- [ ] Implement authentication
- [ ] Implement RBAC and department scopes

## Student

- [ ] Login/signup
- [~] Dashboard
- [x] Complaint form
- [ ] Attachment support
- [ ] Complaint history
- [ ] Status timeline
- [~] Validation/reopen

## Intelligence

- [x] Text normalization
- [x] Category taxonomy
- [~] AI classifier adapter
- [x] Confidence threshold
- [ ] Embedding provider
- [ ] Similarity search
- [~] Duplicate/related decision
- [x] Explainable priority engine

## Orchestration

- [~] Routing rules
- [~] Department queues
- [x] Assignment
- [ ] Cross-department collaboration
- [ ] Event model

## Department

- [ ] Exam Cell dashboard
- [ ] Hostel dashboard
- [ ] Academics/HOD dashboard
- [~] Complaint detail
- [~] Action history
- [x] Resolution

## Accountability

- [ ] SLA policies
- [ ] Due-soon alerts
- [ ] Escalation worker
- [ ] Notification service
- [x] Reopen flow
- [~] Audit log

## Analytics

- [~] Backlog dashboard
- [ ] SLA dashboard
- [~] Category trends
- [~] Duplicate clusters
- [~] Reopen rate
- [ ] AI override rate

## Quality

- [ ] Functional tests
- [ ] AI evaluation dataset
- [ ] Security tests
- [ ] Load test
- [ ] Failure-mode test
- [ ] Demo seed data

## Presentation

- [x] Problem slide (documentation)
- [x] Architecture slide (documentation)
- [x] AI pipeline slide (documentation)
- [~] End-to-end demo (web/API lifecycle only)
- [~] Impact metrics (defined, not measured)
- [x] Sustainability (documentation)
- [x] Judge Q&A (documentation)

## Deployment decision

**No-go for production.** The unchecked foundation, security, worker, test, and deployment tasks are release blockers. The current safe scope is a local or controlled hackathon demo using synthetic data.
