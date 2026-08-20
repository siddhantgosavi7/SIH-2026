# API Contracts

## 0. Intake APIs (SMA03 capability — multi-channel)

```http
POST /api/v1/intake/web           # equivalent to POST /complaints, canonical path
POST /api/v1/intake/email         # simulated adapter for hackathon: accepts a seeded email payload
POST /api/v1/intake/document      # accepts a PDF, runs extraction
```

All three produce the same internal `CanonicalComplaintInput` object and hand off to the identical `POST /api/v1/complaints` processing path used by the web form — there is no separate downstream pipeline per channel. This is what makes the "one platform" claim structurally true rather than just a slide.

## 1. Student APIs

```http
POST /api/v1/complaints
GET  /api/v1/complaints
GET  /api/v1/complaints/{id}
POST /api/v1/complaints/{id}/validation
POST /api/v1/complaints/{id}/reopen
```

## 2. Department APIs

```http
GET  /api/v1/departments/{departmentId}/queue
GET  /api/v1/departments/{departmentId}/complaints/{id}
POST /api/v1/complaints/{id}/assign
POST /api/v1/complaints/{id}/status
POST /api/v1/complaints/{id}/resolve
POST /api/v1/complaints/{id}/request-clarification
```

## 3. Admin APIs

```http
GET  /api/v1/admin/analytics
GET  /api/v1/admin/escalations
PUT  /api/v1/admin/routing-policies/{id}
PUT  /api/v1/admin/sla-policies/{id}
PUT  /api/v1/admin/departments/{id}
```

## 4. Complaint creation response

```json
{
  "complaintId": "CMP-2026-000123",
  "status": "PROCESSING",
  "message": "Complaint received and being classified."
}
```

Do not promise an immediate final department if AI processing is asynchronous.

## 5. Internal events

```text
complaint.created
complaint.classified
complaint.duplicate_detected
complaint.cluster_updated
complaint.prioritized
complaint.routed
complaint.assigned
complaint.sla_due_soon
complaint.escalated
complaint.resolved
complaint.validation_requested
complaint.reopened
complaint.archived
```
