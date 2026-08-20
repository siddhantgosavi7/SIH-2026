# End-to-End Complaint Flow

## 1. Corrected flow

The corrected order is:

**Submit → Normalize → Classify → Detect duplicate/related complaints → Calculate priority → Route → Assign → Work → SLA monitor → Resolve → Student validation → Archive**

```mermaid
flowchart TD
    A[Student submits complaint] --> B[Validate input + attachments]
    B --> C[Normalize text + extract metadata]
    C --> D[AI classification]
    D --> E{Confidence acceptable?}
    E -- No --> F[Human review / fallback category]
    E -- Yes --> G[Semantic duplicate + related search]
    F --> G
    G --> H{Duplicate or related?}
    H -- Yes --> I[Link / aggregate into existing issue cluster]
    I --> J[Recalculate impact and priority]
    H -- No --> K[Create new complaint]
    K --> J
    J --> L[Routing engine]
    L --> M[Department queue]
    M --> N[Assign staff]
    N --> O[SLA monitoring]
    O --> P{Resolved?}
    P -- No --> Q{SLA breached?}
    Q -- No --> N
    Q -- Yes --> R[Escalate + notify]
    R --> N
    P -- Yes --> S[Send resolution to student]
    S --> T{Student validates?}
    T -- Yes --> U[Close + archive]
    T -- No --> V[Reopen / clarification]
    V --> N
```

## 2. Duplicate versus related

Do not force everything into a binary duplicate decision.

Use:

- `DUPLICATE`: essentially the same issue, same context.
- `RELATED`: same underlying issue but different incident/context.
- `NEW`: no meaningful match.

Example:

> "Hostel Block A water supply has been unavailable since morning."

and

> "There is no water in Hostel Block A since 8 AM."

Likely duplicate/related cluster.

But:

> "Hostel Block B water supply failed."

is related at a campus infrastructure level but may be a separate case.

## 3. Aggregation behavior

If multiple complaints describe the same systemic issue:

- preserve each student's original complaint;
- create/maintain an issue cluster;
- increase affected-student count;
- increase impact signal;
- prioritize the cluster;
- allow departments to communicate a common update;
- retain individual student visibility.

Never erase individual complainant records merely because they were aggregated.
