# Technical Architecture & Tech Stack Selection
## Autonomous Grievance Intelligence & Dispatch Engine (AGIDE)

This document outlines the production-grade technical architecture and tech stack selections for the Autonomous Grievance Intelligence & Dispatch Engine. It provides the core engineering justifications, comparative analyses against industry leaders, code paradigms, and strategic mitigations for future operational bottlenecks.

---

## 1. System Topology Overview: The Modular Monolith

Rather than adopting a highly distributed microservices architecture—which introduces severe network overhead, distributed tracing complexity, and deployment friction under tight timelines—this platform is engineered as a **Modular Monolith**. 

All core domains (Intake, Classification, Prioritization, SLA Tracking, Routing, and Audit) reside within a single codebase but are strictly decoupled at the package level. They communicate via well-defined in-process API contracts and share a single transactional database.

```
                  ┌────────────────────────────────────────┐
                  │        Next.js 14 Frontend             │
                  │  (Student, Officer, & Admin Portals)   │
                  └──────────────────┬─────────────────────┘
                                     │ HTTPS REST
                                     ▼
                  ┌────────────────────────────────────────┐
                  │         FastAPI Web Gateway            │
                  │       (Asynchronous Router)            │
                  └──────────┬──────────────────┬──────────┘
                             │                  │ Write Row
                             │ Enqueue Job      ▼
                             │       ┌─────────────────────┐
                             │       │    PostgreSQL 16    │
                             │       │ (Relational Data &  │
                             │       │  pgvector Index)    │
                             │       └─────────────────────┘
                             ▼
                  ┌────────────────────────────────────────┐
                  │          Redis Message Broker          │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────────┐
                  │       RQ Background Workers            │
                  │ (OCR, NLP, Embeddings, LLM Drafts)    │
                  └────────────────────────────────────────┘
```

---

## 2. Frontend Layer: Next.js (App Router) + TypeScript + Tailwind CSS

### The Core Problem
An institutional grievance engine must serve three highly distinct user personas:
1. **Students:** Submit complaints, track status, upload scan proofs, and verify resolutions.
2. **Department Officers:** View department-specific queues, manage SLA timelines, and issue resolutions.
3. **Central Admin:** Access cross-departmental analytics, re-route misclassified cases, and audit system performance.

In a traditional Single Page Application (SPA) architecture (e.g., standard Vite + React), all routing logic, components, and client-side scripts are bundled and sent to the browser. This exposes internal administrative routes to client-side reverse-engineering and results in a "layout flash" while checking JSON Web Tokens (JWTs) in local storage.

### The Technical Solution
**Next.js 14+ with App Router and TypeScript** resolves this by shifting routing, rendering, and access-control enforcement to the server.

* **Server-Side Middleware Guarding:** Session tokens (HTTP-only secure cookies) are intercepted at the Next.js server middleware before page rendering occurs. Unauthorized requests are instantly redirected at the server boundary.
* **Layout Isolation:** Route groups (`(student)`, `(department)`, `(admin)`) isolate role-based styling, navigation bars, and state providers, guaranteeing that administrative code assets are never sent to a student's browser.

#### App Directory Structure
```text
src/app/
├── (auth)/
│   └── login/
│       └── page.tsx           # Shared secure login entrypoint
├── (student)/
│   ├── layout.tsx             # Enforces Student role, injects Student context
│   └── dashboard/
│       └── page.tsx           # Grievance submission and individual timeline
├── (department)/
│   ├── layout.tsx             # Enforces Department Officer role + filters by department_id
│   └── queue/
│       └── page.tsx           # Actionable SLA-driven queue UI
└── (admin)/
    ├── layout.tsx             # Enforces Central Admin superuser role
    └── analytics/
        └── page.tsx           # Global bottleneck monitoring dashboard
```

### Industry Real-World Parallel: Zendesk & Salesforce Service Cloud
Enterprise ticketing systems like **Zendesk** and **Salesforce Service Cloud** process millions of tickets with high security and low latency. They do not run heavy client-side polling or exposed SPA admin logic. Instead, they leverage server-side composition to deliver highly optimized, pre-authorized HTML views, combining them with lightweight real-time subscription frameworks (e.g., Server-Sent Events) to stream real-time updates directly to administrative dashboards.

---

## 3. Backend Core: FastAPI (Python 3.11+)

### The Core Problem
The intake and prioritization pipeline requires executing a chain of high-compute machine learning models:
1. **PaddleOCR / Tesseract:** For digitizing handwritten or scanned administrative paperwork.
2. **spaCy (NER):** For extracting structural entities (Student IDs, Locations, Names).
3. **BAAI/bge-small-en-v1.5:** For generating high-dimensional (384-dim) semantic vector embeddings.
4. **DeBERTa-v3:** For classifying the target department based on text semantics.

If the backend were built on a non-AI-native runtime like Node.js (NestJS) or Go, executing these Python-based deep learning pipelines would require spawning OS-level child processes, or spinning up a multi-language microservice architecture. This would introduce massive serialization penalties (converting image buffers and vector float arrays to JSON/Protobuf across HTTP/gRPC boundaries) and double the infrastructure footprint.

### The Technical Solution
**FastAPI** provides a high-performance, asynchronous web framework built on Python. It allows deep learning libraries to be loaded directly into memory and executed natively.

* **Asynchronous I/O via Starlette:** FastAPI utilizes Python's `async/await` syntax and an ASGI server (Uvicorn) to handle high-concurrency I/O operations without blocking.
* **Rust-Accelerated Validation (Pydantic V2):** Input payloads are validated at compiled speeds via Pydantic's underlying Rust engine, enforcing API contracts before a single line of application code is executed.

#### Core Endpoint Design (Async Handshake Pattern)
```python
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

router = APIRouter()

class CanonicalComplaintInput(BaseModel):
    source_channel: str = Field(..., pattern="^(EMAIL|SCAN_PDF|WEB_PORTAL)$")
    sender_id: Optional[str] = None
    raw_text: str = Field(..., min_length=10)
    attachments: List[str] = []

@router.post(
    "/complaints", 
    status_code=status.HTTP_202_ACCEPTED,
    response_model=dict
)
async def submit_complaint(payload: CanonicalComplaintInput):
    """
    Ingests raw complaints asynchronously. 
    Saves the raw payload immediately with a PENDING state 
    and offloads heavy AI pipeline processing to background workers.
    """
    tracking_code = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    
    # 1. Persist raw complaint row (State: PROCESSING)
    # 2. Enqueue deep processing pipeline job to Redis Queue
    # 3. Return immediately to prevent HTTP timeout
    
    return {
        "tracking_code": tracking_code,
        "status": "PROCESSING",
        "message": "Complaint ingested. Background classification initiated."
    }
```

### Industry Real-World Parallel: Uber's Customer Obsession Ticket Assistant (COTA)
In scaling its customer support ticketing systems, **Uber** engineered COTA to parse unstructured support queries, categorize intents, and suggest solutions using deep learning. In their architecture, keeping the machine learning pipeline coupled to the Python service layer was paramount to avoiding network serialization bottlenecks, allowing them to route millions of support tickets in sub-second times.

---

## 4. Storage & Semantic Search Layer: PostgreSQL 16 + `pgvector`

### The Core Problem
To implement **Semantic Duplicate and Related Incident Detection**, the system must compare incoming complaints against historical records using high-dimensional vector math (cosine distance).

Using a dedicated external vector database (such as Milvus, Qdrant, or Pinecone) alongside a traditional relational database (used for ACID-compliant tracking of ticket metadata, user authentication, and SLA tables) introduces the **Dual-Write Consistency Problem**:
1. **Sync Failures:** If a transaction commits in Postgres but the vector database write fails, the indices are permanently desynchronized.
2. **Referential Integrity Loss:** Deleting or archiving a ticket in Postgres does not automatically clean up the vector index.
3. **Complex Filters:** Finding duplicates within a *specific* category (e.g., only "Hostel" complaints) requires querying the vector database for similar IDs, and then querying Postgres to filter by metadata—destroying query performance.

### The Technical Solution
**PostgreSQL 16 with the `pgvector` extension** unites relational storage and vector search in a single database engine, guaranteeing strict transactional integrity and unified querying.

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Consolidated Complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(30) UNIQUE NOT NULL,
    student_id VARCHAR(50),
    department VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PROCESSING',
    priority_score FLOAT DEFAULT 0.0,
    raw_text TEXT NOT NULL,
    embedding vector(384), -- Matches BGE-small-en-v1.5 output dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Unified Relational & Vector Search Query
To find related, unresolved "Hostel" complaints submitted within the last 48 hours to prevent double-triaging:
```sql
SELECT 
    id, 
    tracking_code, 
    raw_text, 
    (embedding <=> :new_embedding) AS cosine_distance
FROM complaints
WHERE department = 'HOSTEL'
  AND status = 'OPEN'
  AND created_at > NOW() - INTERVAL '48 hours'
ORDER BY embedding <=> :new_embedding
LIMIT 5;
```

### Industry Real-World Parallel: GitLab's Database Consolidation
**GitLab** famously operates on a "Postgres First" philosophy, avoiding the architectural complexity of deploying separate NoSQL or specialized indexes for core transactional paths. By keeping related indexing systems native to PostgreSQL, they maintain a highly reliable, easily testable database layer with absolute ACID consistency.

---

## 5. Background Task Queue: Redis + RQ (Redis Queue)

### The Core Problem
Running heavy AI operations (OCR, vector generations, DeBERTa classifications) synchronously inside an API thread blocks the worker process. Under heavy user load, concurrent uploads of PDF scanned complaints would completely exhaust the web server's connection pool, leading to widespread **504 Gateway Timeouts**.

### The Technical Solution
By introducing **Redis and RQ (Redis Queue)**, the API instantly offloads long-running tasks to background workers, returning a quick HTTP acknowledgment to the user.

* **Why RQ over Celery?** While Celery is powerful, it is highly complex to configure, maintain, and debug. Under hackathon constraints and high-pressure deployments, RQ provides a robust, Python-native, Redis-backed queue system that installs instantly and works with native Python callables without boilerplate configurations.

#### RQ Worker Pattern
```python
# services/ai_pipeline.py
import redis
from rq import Queue

redis_conn = redis.Redis(host='localhost', port=6379, db=0)
job_queue = Queue('ai_pipeline', connection=redis_conn)

def run_processing_job(complaint_id: str, raw_text: str):
    """
    Background worker execution target:
    1. Generates BGE embeddings for raw_text.
    2. Runs similarity duplicate scan via pgvector.
    3. Runs DeBERTa categorization.
    4. Calculates priority score.
    5. Updates DB status from 'PROCESSING' to 'OPEN'.
    """
    # [Worker execution logic here]
    pass
```

### Industry Real-World Parallel: Sentry.io Crash Ingestion
**Sentry** ingestion servers process millions of crash reports per minute. They do not block the thread to perform heavy stack trace symbolication. They validate the payload signature, write the raw dump directly to an ingestion broker, and immediately reply with `200 OK`. Downstream worker pools consume from the queue, symbolicate the memory addresses, deduplicate similar crashes, and notify developers asynchronously.

---

## 6. Strategic Production Bottlenecks & Architectural Mitigations

### Bottleneck A: Vector Search Scalability (Index Performance)
* **The Vulnerability:** K-Nearest Neighbor (KNN) searches default to flat linear scans (`ORDER BY embedding <=> ...`). As the complaints table grows past 100,000 historical records, calculating distance against every vector forces high CPU utilization and full table scans.
* **The Mitigation:** We implement a **Hierarchical Navigable Small World (HNSW)** approximate nearest neighbor index in PostgreSQL:
  ```sql
  CREATE INDEX ON complaints USING hnsw (embedding vector_cosine_ops);
  ```
  HNSW maps vectors onto a multi-layer graph, reducing search complexity from linear \\(O(N)\\) to logarithmic \\(O(\log N)\\), resolving matching records in sub-millisecond speeds even at scale.

### Bottleneck B: Concurrent State Transitions & Race Conditions
* **The Vulnerability:** Multiple background workers (SLA countdown escalators) and human administrators (officers closing cases) might read and write to the same ticket row simultaneously. If an officer marks a ticket as "RESOLVED" at the same millisecond a background worker escalates its state, they could overwrite each other's transitions, corrupting the ticket's state history.
* **The Mitigation:** We employ **Optimistic Concurrency Control (OCC)** using a `version` schema pattern:
  ```sql
  UPDATE complaints 
  SET status = 'RESOLVED', version = version + 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = :id AND version = :expected_version;
  ```
  If another database operation updated the row in the interim, the query affects 0 rows, prompting the service layer to abort the stale state modification and safely trigger a retry.

### Bottleneck C: Zero-Internet Demo Resiliency (API Safeguards)
* **The Vulnerability:** Hackathon venues are notorious for spotty internet. Relying on remote third-party LLM endpoints (e.g., Groq, OpenAI) leaves the live onstage presentation highly vulnerable to API timeouts or connectivity dropouts.
* **The Mitigation:** We enforce a clean **Provider Abstraction Pattern** (`AIProvider`) with deterministic offline simulation flags.
  ```python
  class AIProvider:
      def __init__(self, offline_mode: bool = False):
          self.offline_mode = offline_mode

      def generate_response(self, prompt: str) -> str:
          if self.offline_mode:
              # Return a deterministic, contextually accurate pre-seeded mock response
              return "Deterministic mock resolution generated for local offline demo safety."
          # Execute live API call to LLM
          return remote_llm_api_call(prompt)
  ```
  By setting `DEMO_OFFLINE_MODE=True` in the environment variables, the system bypasses external networking completely, guaranteeing a flawless, bulletproof demonstration.
