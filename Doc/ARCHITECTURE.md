# System Architecture

## 1. Technology Stack

The platform is built as a highly modular monolith.

- **Frontend:** React 18 + Vite (Plain JSX). Deployed as a static SPA.
- **Backend API:** FastAPI (Python 3.12). Handles HTTP requests and synchronous AI pipeline execution.
- **Database:** PostgreSQL 16 + pgvector. Serves as the central registry of complaints, problem groups, and audit history.
- **Cache/Queue:** Redis 7.
- **Background Worker:** RQ Worker with daemon SLA/emerging polling threads.
- **AI/LLM:** HuggingFace Inference API for text categorization, with a deterministic keyword-based heuristic fallback.
- **Containerization:** Docker Compose for local dev and VM deployment.
- **Proxy:** Caddy (Reverse proxy and automatic HTTPS).

> [!WARNING]
> Previous documentation artifacts incorrectly claimed the frontend was Next.js. **The frontend is Vite + React.**

## 2. Component Diagram

```mermaid
flowchart TD
    %% Actors
    Student([Student])
    Staff([Department Staff])
    Admin([System Admin])

    %% Frontend
    subbrowser[Web Browser]
    subgraph SPA [React/Vite Frontend]
        StudentApp[Student Portal]
        StaffApp[Staff Dashboard]
        AdminApp[Admin Console]
    end
    subbrowser --> SPA

    %% Backend
    subgraph Backend [FastAPI Backend]
        Auth[Auth & RBAC]
        Intake[Intake & Routing API]
        QueueAPI[Department Queues API]
        Grouping[Problem Grouping Engine]
    end

    %% External & Workers
    LLM[HuggingFace API]
    Worker[SLA / Escalation Worker]

    %% Data
    DB[(PostgreSQL + pgvector)]
    Cache[(Redis)]

    %% Connections
    Student -->|Files complaint| StudentApp
    Staff -->|Resolves problem| StaffApp
    Admin -->|Monitors| AdminApp

    SPA -->|HTTPS| Backend

    Intake <-->|Classifies| LLM
    Intake --> Grouping
    Grouping --> DB

    QueueAPI <--> DB
    Worker <--> Cache
    Worker <--> DB
```

## 3. Request Flow & Pipeline Stages

When a complaint is submitted, it goes through a deterministic pipeline to extract intelligence and group it.

```text
app.main:app (HTTP POST /complaints)
  -> app.api.routes.complaints.submit_complaint
  -> app.pipeline.orchestrator.analyze_complaint
  -> database commit
```

**Synchronous Pipeline Stages:**
1. **Intake Classification (`services/llm.py`):** Calls HuggingFace to extract Department, Category, and Priority. If the LLM times out (8s) or returns 503, it instantly falls back to keyword-matching (`pipeline/classifier.py`).
2. **Duplicate Detection (`pipeline/duplicate_detector.py`):** Calculates token/sequence similarity against recent complaints. Identifies exact duplicates (≥ 0.70).
3. **Problem Grouping (`services/problem_grouping.py`):** Finds the best matching existing `ProblemGroup` (threshold ≥ 0.40) or creates a new one. Updates the `affected_users` count.
4. **Priority Scoring (`pipeline/priority.py`):** Calculates a deterministic 0-100 `priority_score` using a multi-signal engine based on urgency (from keywords/SLA), impact (affected users), safety risks, and recurrence.

## 4. Backend Package Structure

The backend (`api/api/`) enforces strict service boundaries. `main.py` is minimal (65 lines), primarily registering middleware and mounting 17 specific route modules.

```text
app/
├── main.py                  # 65 lines — app creation, middleware, router inclusion
├── core/                    # Settings, security, logging, constants
├── database.py              # Engine + SessionLocal
├── api/                     # HTTP dependency and route namespaces
│   └── routes/              # 17 route modules (auth, complaints, admin, messages, alerts, etc.)
├── schemas/                 # Pydantic request/response shapes
├── services/                # Business-service boundaries (LLM, grouping, embedding)
├── pipeline/                # Synchronous complaint analysis logic
│   ├── orchestrator.py      # Runs pipeline stages in order
│   ├── classifier.py        # Keyword heuristic fallback classifier
│   ├── duplicate_detector.py# Token similarity duplicate finder
│   ├── priority.py          # Multi-signal priority engine
│   └── priority_signals.py  # Priority signal definitions
├── middleware/              # ASGI Middleware
│   └── request_logging.py   # Injects X-Request-ID, logs duration
├── workers/                 # Background polling tasks
│   └── sla_tasks.py         # SLA escalation logic
├── models.py                # Current model implementation (DB tables)
├── rbac.py                  # Role access checks (require_role, enforce_view_complaint)
├── errors.py                # Standardized JSON `{success, error}` envelope handler
├── logging_config.py        # JSONFormatter with structured context fields
└── audit.py                 # Audit event persistence
```

## 5. Key Architectural Decisions

- **ProblemGroup vs Complaint:** To solve the "100 students report the same broken pipe" problem, the system uses two layers. `Complaint` is the individual student ticket (immutable history, individual feedback). `ProblemGroup` is the aggregate department operational view. Departments solve the Group, and the solution propagates to all member Complaints.
- **Category Badge Location:** `Complaint.category` is set by the LLM/classifier. `ProblemGroup` does NOT store the category in the DB — it uses a Python `@property` to read it from its member complaints. This avoids schema migrations while surfacing it in the UI.
- **Observability:** Centralized JSON logging (`logging_config.py`) ensures all logs include `request_id`, `user_id`, and `complaint_id`. A global error handler (`errors.py`) prevents stack traces from leaking via the API, always returning a standardized `{success: False, error: {code, message}}` structure.
- **Idempotency:** Repeated "I Have This Problem Too" clicks by the same student for the same active problem are caught and return the existing active complaint ID rather than creating duplicates.
