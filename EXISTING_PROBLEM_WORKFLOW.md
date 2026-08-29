# Existing Problem / "I Have This Problem Too" Workflow

## Goal

A student first searches the active real-world problems already known to the institution. If the issue matches, the student clicks **Report this problem / I have this problem too** instead of writing a new complaint.

The system creates a **private complaint record for that student**, but links it to the same `ProblemGroup`. Staff therefore work on one real-world problem while every student keeps an individual ticket for status, comments, notifications and feedback.

## Student endpoints

### 1. Discover active problems

`GET /problems`

Query parameters:

- `department` — exact department filter, e.g. `Hostel`
- `priority` — `low | normal | high | urgent`
- `status` — `open | in_progress | escalated`
- `q` — title/description search text
- `limit` — 1–100, default 50
- `offset` — pagination offset, default 0

Example:

```text
GET /problems?department=Hostel&priority=high&q=water
Authorization: Bearer <STUDENT_TOKEN>
```

Response contains a student-safe problem projection plus:

- `already_reported`
- `my_complaint_id`
- `my_complaint_status`
- `affected_users`
- `complaint_count`

### 2. View one problem

`GET /problems/{problem_id}`

Only active problems are exposed to students.

### 3. Report an existing problem

`POST /problems/{problem_id}/report`

No request body is required.

The backend:

1. verifies the student role;
2. verifies that the problem is still active;
3. prevents duplicate active reports by the same student;
4. creates a new complaint for that student;
5. links it to the existing `problem_group_id`;
6. routes it to the same department;
7. assigns the department's current/default staff assignee;
8. updates the group's affected-student count;
9. writes an audit event.

The returned `complaint_id` is the student's normal complaint ticket and can be used with the existing complaint endpoints.

## Staff workflow

Staff can continue using the existing endpoints:

- `GET /staff/problems` — list grouped real-world problems
- `GET /staff/problems/{problem_id}` — see the problem and all participating students
- `PUT /staff/problems/{problem_id}/solution` — resolve the real-world problem

**Important:** Staff should solve a grouped problem through `/staff/problems/{problem_id}/solution`. The backend also makes the existing `PUT /complaints/{complaint_id}/solution` group-aware, so solving one grouped complaint propagates the same solution to every active member of that problem.

When a grouped problem is solved:

- every active student complaint in the group becomes `resolved`;
- every student's `solution_text` is populated;
- every student receives an in-app notification;
- each complaint gets a `complaint.solution.provided` audit event;
- the problem group stores the canonical solution.

Students then use the existing:

- `GET /complaints/{complaint_id}/solution`
- `POST /complaints/{complaint_id}/feedback`
- `POST /complaints/{complaint_id}/reopen`
- `GET /complaints/{complaint_id}/timeline`

A student's rejection/reopen is **individual**. It does not erase the accepted solution for other students. The group becomes active again when any member is reopened.

## Database changes

No new database migration is required for this feature.

The current schema already has the required relationship:

```text
problem_groups.id
        ↑
        │
complaints.problem_group_id
```

`ProblemGroup` already stores the aggregate problem, and each `Complaint` already stores its own `student_id`, status, solution and feedback. The new student discovery fields are API response fields only.

## Frontend fetcher

File: `web/src/api/problems.js`

Use it with the existing `api()` function from `AuthContext`:

```js
const { api } = useAuth();

const problems = await fetchExistingProblems(api, {
  department: 'Hostel',
  priority: 'high',
  q: 'water',
});

const result = await reportExistingProblem(api, problems[0].id);
// result.complaint_id -> navigate to the student's normal complaint page
```

Do not send a student ID, department ID, assignee ID, priority or affected-user count from the browser when reporting an existing problem. The backend derives these values from the authenticated student and the canonical problem group.
