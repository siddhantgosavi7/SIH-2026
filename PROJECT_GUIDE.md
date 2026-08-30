# SIH-2026 — Smart Complaint Prioritization System
## Complete Project Guide for New Team Members

---

## 1. What Is This Project?

**Problem Statement (SIH 2026):**
> "Develop an AI-based system that categorizes institutional complaints and prioritizes them according to urgency and impact."

This is a full-stack web application for a college/institution where **students** file grievances and **department staff** resolve them. The AI automatically:
- **Categorizes** each complaint into the right department and issue category
- **Detects duplicates** — if 30 students all complain about the same broken water pipe, they are grouped
- **Prioritizes** the group by urgency and number of affected students
- **Notifies** students when their complaint is resolved

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (plain JSX) |
| Backend API | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 + pgvector |
| Cache / Queue | Redis 7 |
| Background Worker | Python (lightweight polling worker) |
| AI / LLM | HuggingFace Inference API |
| Auth | JWT (HS256) |
| Migrations | Alembic |
| Containerization | Docker Compose |

---

## 3. Repository Structure

The important parts:

- api/api/  <- THE LIVE BACKEND (use this one ONLY)
  - app/main.py           <- App factory + all route mounting
  - app/models.py         <- All SQLAlchemy ORM models (every DB table)
  - app/schemas.py        <- Pydantic request/response shapes
  - app/config.py         <- Settings from .env
  - app/pipeline/         <- AI complaint processing pipeline
    - orchestrator.py     <- Wires all stages
    - classifier.py       <- Keyword-based fallback classifier
    - duplicate_detector.py  <- Token similarity duplicate finder
    - priority.py         <- Priority scoring formula
    - policies.py         <- Default DepartmentPolicy seeder
  - app/services/         <- Business logic
    - intelligent_intake.py  <- LLM-first intake wrapper
    - llm.py              <- HuggingFace API client
    - problem_grouping.py <- Groups complaints into ProblemGroups
  - app/api/routes/       <- HTTP route handlers
  - alembic/              <- DB migration scripts
  - seed_staff.py         <- Seeds staff demo accounts

- web/src/               <- React frontend
  - pages/               <- One file per page/view
  - components/          <- Shared layout components
  - context/             <- AuthContext (JWT state)

- docker-compose.yml     <- Runs everything with one command

WARNING: api/archive/ and api_backeup/ are old drafts. Never touch them.

---

## 4. User Roles

| Role | What they can do |
|---|---|
| student | Sign up, submit complaints, view own history, give feedback |
| staff | See dept complaints, view grouped problems, resolve them |
| department_head | Same as staff |
| admin | See everything, manage all users and departments |

---

## 5. How a Complaint Flows Through the System

1. Student submits a complaint (title + description).
2. intelligent_intake.build_payload() runs:
   a. Calls HuggingFace LLM (8s timeout). Gets: department, category, priority, priority_reasons.
   b. If LLM fails (503, timeout, bad JSON) -> falls back to keyword classifier.
3. find_similar_complaints() scans historical complaints -> counts distinct affected students.
4. orchestrator.analyze_complaint() runs:
   - If no LLM category: classify_complaint() keyword fallback.
   - apply_priority() for urgency scoring.
   - Sets sla_due_at from DepartmentPolicy.
   - detect_duplicates() -> marks as duplicate if similarity >= 0.75.
5. Complaint is saved to DB.
6. group_complaint() finds or creates a ProblemGroup:
   - Uses token+sequence similarity (threshold 0.40).
   - Recalculates: urgency_score, impact_score, priority_score.
   - Sets group priority label (low/normal/high/urgent).

---

## 6. The AI Pipeline

### LLM Categorization (services/llm.py)
- HuggingFace Inference API, configurable model (set HF_TOKEN + HF_MODEL in .env)
- 8-second hard timeout
- 503 (model cold-start) = instant fallback
- Strict validation: department must be from allowed list; priority must be low/normal/high/urgent
- Cleans markdown code fences from output before JSON parsing

### Heuristic Fallback (pipeline/classifier.py)
- Tokenizes text -> keyword-matches against DepartmentPolicy rows
- Highest-scoring policy wins -> sets category, department, sla_due_at

### Duplicate Detection (pipeline/duplicate_detector.py)
- Score = 0.80 * Jaccard_token_overlap + 0.20 * SequenceMatcher_ratio
- >= 0.75 -> marked as duplicate (duplicate_of_id set)
- >= 0.40 -> grouped into same ProblemGroup

### Priority Scoring (services/problem_grouping.py)
- urgency_score = SLA deadline pressure + complaint velocity
- impact_score = affected_users proportion vs maximum seen
- priority_score = 55% urgency + 45% impact (0-100 scale)
- Bands: 0-40 LOW, 40-65 MEDIUM, 65-85 HIGH, 85-100 CRITICAL

---

## 7. Database Schema (Key Tables)

users: id, email, username, hashed_password, role, department, is_active

student_profiles: id, user_id, full_name, prn_number, division, roll_no, year_semester

complaints: id (UUID), student_id, department, category, subcategory
  priority, status, title, description, affected_users
  classification_confidence, priority_reasons (JSON)
  sla_due_at, duplicate_of_id, problem_group_id
  solution_text, solution_by_id, solution_at
  feedback_accepted, feedback_comment, deleted_at

problem_groups: id (UUID), problem_code (PROB-XXXX), title, description, department
  complaint_count, affected_users
  urgency_score, impact_score, priority_score
  priority, status, solution_text, solution_by_id, solution_at

department_policies: name (=department), category, keywords (JSON), sla_hours

complaint_relations: source/target complaint IDs, similarity_score
complaint_embeddings: complaint_id, embedding (1536-dim pgvector)
notifications: user_id, complaint_id, channel, subject, body, sent_at
audit_logs: actor_id, action, entity_type, entity_id, metadata
messages: sender_id, recipient_id, complaint_id, subject, body, is_read

---

## 8. Frontend Pages

| Page | Route | Who |
|---|---|---|
| Home.jsx | / | Everyone |
| Login.jsx | /login | Everyone |
| Signup.jsx | /signup | Everyone |
| MyProfile.jsx | /myProfile | Students: submit + view complaints |
| UserDashboard.jsx | /dashboard | Students: overview |
| UserProblemList.jsx | /problems | Students: grouped view with category badge |
| UserComplaintDetail.jsx | /complaints/:id | Students: detail view |
| DepartmentQueue.jsx | /department | Staff: Central Thought dashboard |
| AdminDashboard.jsx | /admin | Admin: all departments |
| ResolveComplaint.jsx | /resolve/:id | Staff: resolve a problem group |

---

## 9. Key API Endpoints

Auth:
- POST /auth/signup    <- Create student account
- POST /auth/login     <- Returns JWT access token
- GET  /auth/me        <- Current user info

Complaints (Student):
- POST /complaints            <- Submit a complaint
- GET  /complaints            <- List my complaints
- GET  /complaints/{id}       <- Get complaint detail
- PUT  /complaints/{id}/feedback <- Accept/reject resolution

Department Dashboard (Staff):
- GET /staff/problems           <- List problem groups (?q=, ?priority=, ?status=, ?limit=, ?offset=)
- GET /staff/problems/{id}      <- Detail with all linked complaints
- PUT /staff/problems/{id}/solution <- Resolve, notifies all students

Admin:
- GET  /admin/complaints  <- All complaints
- GET  /admin/users       <- All users
- POST /admin/users       <- Create staff/admin

Full interactive docs: http://localhost:8000/docs

---

## 10. Local Development Setup

Prerequisites: Docker Desktop, Node.js 20+ (for local frontend only)

Step 1 - Clone and configure:
  git clone https://github.com/siddhantgosavi7/SIH-2026.git
  cd SIH-2026
  cp api/api/.env.example api/api/.env
  # Edit api/api/.env with your values (see Section 13)

Step 2 - Start all services:
  docker compose up -d --build
  # Starts: postgres:5432, redis:6380, api:8000, worker, web:5173

Step 3 - Seed demo data:
  docker compose exec api python seed_staff.py           # Staff accounts
  docker compose exec api python seed_demo_problems.py   # 3 Hostel problem groups
  docker compose exec api python seed_demo_complaints.py # 58 dummy complaints

Step 4 - Open:
  Frontend: http://localhost:5173
  API Docs: http://localhost:8000/docs

---

## 11. Demo Accounts

| Username | Password | Role | Dept |
|---|---|---|---|
| hostel_staff | staff@123 | staff | Hostel |
| cse_staff | staff@123 | staff | CSE |
| aiml_staff | staff@123 | staff | AIML |
| csbs_staff | staff@123 | staff | CSBS |
| mech_staff | staff@123 | staff | Mechanical |
| elec_staff | staff@123 | staff | Electrical |
| entc_staff | staff@123 | staff | ENTC |
| biotech_staff | staff@123 | staff | Biotech |
| exam_staff | staff@123 | staff | Exam Cell |
| canteen_staff | staff@123 | staff | Canteen |

Admin: set ADMIN_USERNAME + ADMIN_PASSWORD in .env
Students: register at /signup

---

## 12. Useful Commands

  docker compose logs -f api                      # Live API logs
  docker compose up -d --build api                # Restart API after code change
  docker compose exec api alembic upgrade head    # Apply DB migrations
  docker compose exec postgres psql -U complaints -d complaints   # Postgres shell

  # Local API dev (faster iteration):
  cd api/api
  pip install -r requirements.txt
  DATABASE_URL=... JWT_SECRET=... uvicorn app.main:app --reload

  # Local frontend dev:
  cd web && npm install && npm run dev

---

## 13. Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| DATABASE_URL | YES | — | PostgreSQL connection string |
| JWT_SECRET | YES | — | Min 32 chars |
| REDIS_URL | no | redis://localhost:6379/0 | Redis |
| HF_TOKEN | no | — | HuggingFace API token |
| HF_MODEL | no | — | HuggingFace model ID |
| ADMIN_USERNAME | no | admin | Auto-created admin |
| ADMIN_EMAIL | no | — | Admin email |
| ADMIN_PASSWORD | no | — | Admin password |
| ALLOWED_ORIGINS | no | http://localhost:5173 | CORS (comma-sep) |
| MAX_UPLOAD_BYTES | no | 5242880 | Max file size |
| SLA_CHECK_INTERVAL_SECONDS | no | 300 | Worker frequency |
| SMTP_HOST | no | — | Email host |

---

## 14. Architecture Decisions and Gotchas

Dead code: api/archive/ and api_backeup/ are old versions. Never edit them.

No Celery: The worker is a simple polling loop (app/worker.py). Kept lightweight for the hackathon.

Category badge: Complaint.category is set by LLM/classifier. ProblemGroup does NOT store
category in the DB — it has a Python @property that reads it from the first linked complaint.
This avoids a migration while surfacing it in the API and UI.

SLA Escalation: Worker queries complaints where sla_due_at < now() and status = 'open',
escalates them, and sends notifications. SLA hours come from DepartmentPolicy.

Duplicate vs Grouping:
- Duplicate (>= 0.75): marks complaint as clone of another (duplicate_of_id)
- Grouping (>= 0.40): aggregates complaints into a shared ProblemGroup

---

## 15. Making Code Changes

Backend change:
1. Edit files in api/api/app/
2. If you changed models.py, run migrations:
   docker compose exec api alembic revision --autogenerate -m "describe change"
   docker compose exec api alembic upgrade head
3. Restart: docker compose up -d --build api

Frontend change:
1. Edit files in web/src/
2. Local dev: hot-reloads with npm run dev
3. Docker: docker compose up -d --build web

Adding a new department:
1. Add to allowed_departments in services/intelligent_intake.py
2. Add a DepartmentPolicy entry in pipeline/policies.py defaults
3. Add staff entry in seed_staff.py and re-run it

---

## 16. Key Files Quick Reference

| File | Purpose |
|---|---|
| api/api/app/main.py | All route mounting, app startup |
| api/api/app/models.py | Every database table |
| api/api/app/schemas.py | Every API request/response shape |
| api/api/app/services/llm.py | HuggingFace LLM with fallback |
| api/api/app/services/intelligent_intake.py | LLM-first intake wrapper |
| api/api/app/pipeline/orchestrator.py | Wires all pipeline stages |
| api/api/app/services/problem_grouping.py | Complaint -> ProblemGroup logic |
| api/api/app/api/routes/problem_groups.py | Department dashboard API |
| web/src/pages/DepartmentQueue.jsx | Staff dashboard UI |
| web/src/pages/MyProfile.jsx | Student complaint submission UI |
| docker-compose.yml | Service orchestration |

---

Last updated: August 2026
