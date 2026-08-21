# Security, Privacy and Audit

## 1. Authentication

Use institutional SSO if available. Otherwise use secure email/OTP or password authentication for the prototype.

## 2. Authorization

Use RBAC with department scope.

Never trust a department ID supplied by the browser. Derive access from the authenticated user's authorization claims.

## 3. Data minimization

Departments should see only data required to resolve the case.

Examples:

- Student identity: visible when operationally necessary.
- Sensitive attachments: restricted.
- Cross-department cases: least-privilege access.

## 4. Audit

Audit:

- login/security events;
- complaint creation;
- AI classification;
- priority changes;
- routing changes;
- assignments;
- status transitions;
- escalations;
- resolution;
- reopening;
- administrative configuration changes.

## 5. AI auditability

Store:

- model/version;
- prompt or policy version where applicable;
- classification result;
- confidence;
- priority factors;
- routing recommendation;
- human override;
- timestamp.

## 6. Security controls

Minimum:

- HTTPS;
- secure session/token handling;
- input validation;
- file type and size validation;
- malware scanning for uploaded files where feasible;
- rate limiting;
- database backups;
- secrets outside source code;
- structured logging without sensitive content.

## 7. Privacy

Do not send unnecessary personally identifiable information to third-party AI services.

If an external model is used:

- minimize payload;
- redact unnecessary identifiers;
- document provider/data handling;
- provide a local/mock fallback for the demo if connectivity fails.
