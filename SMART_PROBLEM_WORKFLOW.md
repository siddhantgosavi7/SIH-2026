# Smart Existing-Problem Workflow

This build adds the student-facing workflow for SIH:

1. Students can browse **Existing Problems**.
2. Existing problems can be searched by title/description and filtered by department, priority, and active status.
3. A student can open a problem and click **I Have This Problem Too**.
4. Joining creates the student's own complaint ticket but **does not create another ProblemGroup**. The ticket points to the same department-facing problem.
5. A newly created complaint creates a new ProblemGroup when the student chooses **This is different — Continue Creating New Complaint**. That new problem immediately appears in the Existing Problems feed for other students.
6. While typing a new complaint, the frontend calls `GET /problems/similar` and shows ranked suggestions. The recommendation endpoint is read-only.
7. If a student joins an existing problem, the department/staff workflow remains shared. Group resolution propagates the solution to all member complaints, so every affected student can review the same solution and submit independent feedback.

## Student API

### List existing problems
`GET /problems`

Query parameters:
- `q` — search title/description
- `department` — department filter
- `priority` — low/normal/high/urgent
- `status` — open/in_progress/escalated
- `limit`, `offset` — pagination

### View one existing problem
`GET /problems/{problem_id}`

### Similarity suggestions while typing
`GET /problems/similar?title=...&description=...`

Returns ranked active problem groups with a `similarity` score. It does not create anything.

### Join an existing problem
`POST /problems/{problem_id}/report`

Creates one student complaint attached to the existing ProblemGroup. Repeated joins by the same student are idempotent at the application level and return the existing active complaint.

### Create a genuinely new complaint
`POST /complaints`

Normal body:
```json
{
  "title": "Bathroom fan is not working",
  "description": "The exhaust fan in Hostel A bathroom has stopped working."
}
```

When the UI has shown similar problems and the student chooses **This is different**, it sends:
```json
{
  "title": "Bathroom fan is not working",
  "description": "The exhaust fan in Hostel A bathroom has stopped working.",
  "force_new": true
}
```

`force_new=true` bypasses automatic ProblemGroup merging and creates a new searchable problem. Existing complaint similarity relations may still be recorded for audit/analytics; they do not merge the new problem into the old operational group.

## Important existing lifecycle

The already-working complaint lifecycle remains:

`open -> in_progress -> resolved -> closed`

Staff solution is propagated across a ProblemGroup. Student feedback can accept (`closed`) or reject (`in_progress`) the solution.

## Database changes

No new database table or migration is required by this feature because the existing build already contains:

- `problem_groups`
- `complaints.problem_group_id`
- `complaints.affected_users`
- problem grouping and solution propagation

The only schema change in this build is an API-level `force_new` field on `ComplaintCreate`.
