# Smart Problem Workflow — Change Log

## Added
- Student Existing Problems discovery UI.
- Search across active problem titles/descriptions.
- Department and priority filters.
- View existing problem details.
- `I Have This Problem Too` action.
- Duplicate-safe join behavior per student.
- Live similarity suggestions while typing a new complaint.
- Explicit `This is different — Continue Creating New Complaint` flow.
- `force_new` API option to create a new ProblemGroup even when similar problems exist.
- Newly created ProblemGroups automatically appear in the Existing Problems feed.
- API helper functions in `web/src/api/problems.js`.
- Student workflow documentation and smoke-test commands.

## Preserved
- Existing authentication/RBAC.
- Department classification and routing.
- Priority calculation.
- ProblemGroup aggregation and affected-user counts.
- Staff dashboard/queue.
- Status transitions.
- Group-level solution propagation.
- Student feedback and reopen behavior.
- Timeline/audit events.

## Security
- The generated package intentionally does not include the working `api/.env` file. Use the existing local environment or copy `api/.env.example` to `api/.env` and fill in the deployment values.
