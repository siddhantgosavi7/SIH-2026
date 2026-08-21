# Canonical Architecture and Flow Diagrams

## 0. Multi-channel intake (SMA03 → MSC02 join point)

```mermaid
flowchart TD
    A[Web] --> WA[Web Adapter]
    B[Email] --> EA[Email Adapter]
    C[PDF/Document] --> DA[Document Adapter]
    D[Scanned Doc - future] --> OA[OCR Adapter]
    WA --> CANON[CanonicalComplaintInput]
    EA --> CANON
    DA --> CANON
    OA --> CANON
    CANON --> MSC[MSC02 Grievance Intelligence Pipeline]
```

This is the diagram that proves "one unified platform" rather than "two systems merged." Every channel produces the same canonical object; MSC02 never branches logic by source channel.

## 1. Student flow

```mermaid
flowchart LR
    A[Home] --> B[Login / Signup]
    B --> C{Authentication}
    C -- Invalid --> B
    C -- Success --> D[Student Dashboard]
    D --> E[Previous & Pending Complaints]
    D --> F[Complaint Status]
    D --> G[Notifications]
    D --> H[Initiate New Complaint]
    H --> I[Submit Complaint]
```

## 2. Intelligence and orchestration

```mermaid
flowchart TD
    A[Submitted Complaint] --> B[Central Orchestrator]
    B --> C[Normalize + Extract Metadata]
    C --> D[AI Classification]
    D --> E{Confidence OK?}
    E -- No --> F[Human Review]
    E -- Yes --> G[Duplicate / Related Search]
    F --> G
    G --> H{Existing Related Issue?}
    H -- Yes --> I[Link / Aggregate]
    H -- No --> J[Create New Case]
    I --> K[Priority Engine]
    J --> K
    K --> L[Routing Policy]
    L --> M[Department Queue]
```

## 3. Department resolution

```mermaid
flowchart LR
    A[Department Queue] --> B[Dashboard]
    B --> C[Assign]
    C --> D[Investigate]
    D --> E[Update]
    E --> F[Resolve]
    F --> G[Central Record + Audit]
    G --> H[Student Validation]
    H --> I{Accepted?}
    I -- Yes --> J[Close + Archive]
    I -- No --> K[Reopen]
    K --> C
```

## 4. Escalation

```mermaid
flowchart TD
    A[Assigned] --> B[Monitor SLA]
    B --> C{Due Soon?}
    C -- No --> B
    C -- Yes --> D[Notify]
    D --> E{Resolved?}
    E -- Yes --> F[Close]
    E -- No --> G[Escalate]
    G --> H[Supervisor]
    H --> I{Resolved?}
    I -- No --> J[Department Head]
    J --> K[Central Authority]
```

## 5. Data architecture

```mermaid
flowchart LR
    C[(Central Complaint Registry)]
    Q1[(Exam Queue)]
    Q2[(Hostel Queue)]
    Q3[(Academics Queue)]
    A[(Audit Log)]
    R[(Archive)]
    C --> Q1
    C --> Q2
    C --> Q3
    Q1 --> C
    Q2 --> C
    Q3 --> C
    C --> A
    C --> R
```

## 6. Important diagram rule

Avoid diagrams that show:

- deletion as the final state;
- duplicate detection before classification;
- an unlabeled infinite feedback loop;
- departments owning the only copy of a complaint;
- AI directly changing institutional policy.

Every diagram should make ownership, state transition, and fallback behavior clear.
