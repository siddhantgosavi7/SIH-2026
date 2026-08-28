# Recommended Technology Stack and Implementation

## 1. Hackathon-friendly stack

### Frontend

- React / Next.js
- TypeScript
- Tailwind CSS
- responsive dashboard components

### Backend

- FastAPI or Node.js/NestJS
- REST API
- background worker system

### Database

- PostgreSQL
- pgvector for semantic search if available

### AI

Use a modular AI adapter:

```text
AIProvider
  ├── EmbeddingProvider
  ├── ClassificationProvider
  └── ExplanationProvider
```

This allows an API model to be swapped later.

### Notifications

- email provider;
- in-app notifications;
- optional SMS/push integration.

## 2. Suggested repository

```text
project/
├── apps/
│   ├── web/
│   └── api/
├── workers/
├── packages/
│   ├── shared-types/
│   └── ui/
├── ai/
├── db/
│   ├── migrations/
│   └── seeds/
├── docs/
├── tests/
├── infra/
└── README.md
```

## 3. Build order

### Phase 1 — foundation

- authentication;
- roles;
- student portal;
- complaint creation;
- central complaint registry.

### Phase 2 — intelligence

- classification;
- embedding generation;
- duplicate/related detection;
- priority scoring.

### Phase 3 — orchestration

- routing policies;
- department queues;
- assignments;
- dashboards.

### Phase 4 — accountability

- SLA worker;
- escalation;
- notifications;
- resolution;
- validation;
- reopen.

### Phase 5 — proof

- analytics;
- audit timeline;
- test cases;
- demo dataset;
- deployment.

## 4. Avoid overengineering

Do not build separate microservices just to make the architecture look impressive. A modular backend is more sustainable for a hackathon and easier to demonstrate.
