# Security & Access Control

GIOP is designed with security and data privacy as core architectural tenets, particularly regarding student identity and department isolation.

## 1. Role-Based Access Control (RBAC) Matrix

Every protected API endpoint enforces RBAC on the server side using the `require_role` or `enforce_view_complaint` dependencies in `app/rbac.py`.

| Feature | Student | Staff | Department Head | Admin |
|---------|---------|-------|-----------------|-------|
| Create Complaint | ✅ | ❌ | ❌ | ❌ |
| View Own Complaints | ✅ | ❌ | ❌ | ❌ |
| View Other's Complaints | ❌ | ❌ | ❌ | ❌ |
| View Dept Complaints | ❌ | ✅ (Own Dept Only) | ✅ (Own Dept Only) | ✅ (All) |
| Resolve Problems | ❌ | ✅ (Own Dept Only) | ✅ (Own Dept Only) | ✅ (All) |
| Delete Complaints | ✅ (Own Only) | ❌ | ❌ | ✅ (All) |
| Create Staff Accounts | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| View Public Stats | ✅ | ✅ | ✅ | ✅ |

### Enforcement Logic
- **403 Forbidden:** Returned if a user attempts to access an endpoint they don't have the role for.
- **404 Not Found (Anti-Enumeration):** If a user attempts to access a specific resource (like a complaint ID) that exists but belongs to someone else, the system returns a 404 rather than a 403 to prevent ID enumeration attacks.

## 2. Authentication & Data Protection

- **JWT Auth:** Stateless authentication using RS256/HS256 JSON Web Tokens. Tokens expire and require re-authentication. The `JWT_SECRET` must be a strong 32+ character string in production.
- **Password Hashing:** All passwords are mathematically one-way hashed using `bcrypt` with a secure work factor before ever touching the database.
- **Data Isolation:** Departments are strictly isolated. A staff member in `Hostel` cannot query complaints assigned to `CSE`. The isolation is applied at the SQL query level, not just the application level.

## 3. File Upload Security

Students can attach evidence (images/PDFs) to their complaints. GIOP protects against malicious uploads through multiple layers:

1. **Magic Byte Validation:** Checking the `Content-Type` header is not enough, as it can be spoofed. `app.api.routes.complaints.validate_file_type()` reads the actual binary header (magic bytes) of the file to ensure a `.jpg` is truly a JPEG and a `.pdf` is truly a PDF.
2. **Filename Sanitization:** The original filename is discarded. Files are renamed using a UUID + the validated extension (e.g., `550e8400-e29b-41d4-a716-446655440000.pdf`). This completely mitigates path traversal (`../../etc/passwd`) attacks.
3. **Size Limits:** Enforced at the proxy (Caddy) and application layer to prevent Denial of Service (DoS) via memory exhaustion.

## 4. Rate Limiting

To prevent API abuse and brute-force attacks, GIOP implements distributed rate limiting:

- **Redis-Backed:** Uses Redis to track request counts across distributed instances.
- **In-Memory Fallback:** Automatically falls back to an in-memory dictionary if Redis is unavailable, ensuring the application remains protected.
- **Thresholds:** The default limit is 120 requests per 60 seconds per IP address (or user ID, if authenticated).
- **Response:** Returns `429 Too Many Requests` when exceeded.

## 5. Audit Trail

High-privilege actions and critical lifecycle events are immutably recorded in the `audit_logs` table.

- **Captured Events:** Deletions, overrides, manual re-routing, staff creation.
- **Data Logged:** Who performed the action (`actor_id`), what happened (`action`), and contextual metadata (`event_metadata`).
- **Visibility:** Only available to the `admin` role.

## 6. Secure Logging

Logs are formatted as structured JSON for SIEM integration but are strictly filtered:
- No passwords or tokens are ever logged.
- PII (Personally Identifiable Information) like student names is excluded from access logs.
- Every log includes a UUID `request_id` to trace a request through the system without relying on user identity.
