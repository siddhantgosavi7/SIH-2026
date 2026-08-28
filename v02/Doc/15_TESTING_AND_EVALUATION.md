# Testing and Evaluation

## 1. Functional test scenarios

### Scenario A — new complaint

Student submits a hostel water complaint.

Expected:

- category = Hostel;
- subcategory = Water;
- priority calculated;
- routed to Hostel;
- queue item created;
- student receives tracking ID.

### Scenario B — duplicate complaint

Second student reports the same outage.

Expected:

- related/duplicate detected;
- existing issue cluster updated;
- affected-user count increases;
- priority may increase;
- both students retain individual complaint history.

### Scenario C — wrong AI classification

Complaint is classified with low confidence.

Expected:

- human review queue;
- no silent incorrect routing;
- correction logged.

### Scenario D — SLA breach

Department does not act before the deadline.

Expected:

- alert;
- escalation;
- audit event;
- dashboard visibility.

### Scenario E — resolution

Department resolves complaint.

Expected:

- active queue item becomes resolved;
- central record retained;
- audit event written;
- student receives validation request.

### Scenario F — student rejects resolution

Expected:

- case reopens;
- previous resolution remains in history;
- department receives a new action item.

## 2. AI evaluation

Measure separately:

- classification accuracy/F1;
- duplicate detection precision;
- duplicate detection recall;
- routing accuracy;
- human override rate.

Do not use only a generic "AI accuracy" number.

## 3. Security tests

- unauthorized department access;
- IDOR/object-level authorization;
- malicious attachment;
- oversized input;
- rate limiting;
- token/session abuse.

## 4. Load tests

Test:

- burst complaint creation;
- many complaints entering one department;
- concurrent dashboard access;
- background job retries.

## 5. Acceptance criteria

A demo build is successful when the complete lifecycle can be executed without manual database edits.
