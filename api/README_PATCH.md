# Problem-grouping patch — fixed version

## What was actually broken before
1. **Grouping never worked.** The embedding was computed but never saved,
   and the match check used `hasattr(g, 'embedding')` on a column that
   didn't exist — so every complaint created a new group instead of being
   matched to an existing one.
2. **Migration did nothing.** `000_problem_groups.py` was just a comment.
3. **Route wasn't wired up.** `complaints_patch.py` was fully commented-out
   pseudocode.
4. **Duplicate problem codes.** Codes were generated per-department
   (`len(groups)+1`) but the column was globally unique, and two
   concurrent requests could generate the same code.
5. **No staff dashboard endpoint existed.** Only the ingestion side was
   built.
6. **No distinct-student tracking.** A student complaining twice about the
   same problem would have counted as two students.

## What changed
- `app/db/models/problem_group.py` — added `embedding`, `distinct_student_count`,
  and a new `ProblemGroupStudent` link table (unique per student+group).
- `app/services/embedding_service.py` — lazy-loads the model; adds
  `to_storable`/`from_storable` so embeddings can round-trip through the DB.
- `app/services/problem_grouping.py` — actually compares against stored
  embeddings, generates department-prefixed unique codes, takes a
  per-department Postgres advisory lock to avoid race conditions, and
  tracks distinct students separately from total complaint count.
- `app/api/routes/complaints_patch.py` — a real, copy-pasteable snippet
  showing exactly where this plugs into your existing `POST /complaints`.
- `app/api/routes/department_dashboard.py` — **new**. `GET
  /departments/{department}/problems`, restricted to that department's
  staff (or admin), returns one row per problem (title, priority, distinct
  student count) — not a raw complaint list.
- `alembic/versions/000_problem_groups.py` — a real migration that creates
  both tables and the FK column on `complaints`.

## You still need to do this manually
1. In the migration, set `down_revision` to your actual current head.
2. In `department_dashboard.py`, fix the two import paths
   (`app.db.session.get_db`, `app.api.deps.get_current_staff_user`) to match
   your project, and confirm your staff-user object really has
   `.role`/`.department` attributes (or swap in your own auth check).
3. Add `problem_group_id` and a `student_id` column to your real `Complaint`
   model if it doesn't have one already.
4. `pip install sentence-transformers scikit-learn numpy` if not already
   installed.
5. The advisory lock in `_lock_department()` only takes effect on
   PostgreSQL. If you're on SQLite/MySQL in production (not just tests),
   tell me and I'll swap in a portable row-lock instead.
