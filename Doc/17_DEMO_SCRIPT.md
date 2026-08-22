# Hackathon Demo Script

## Opening — 30 seconds

"Students can submit complaints today. The harder problem is what happens after submission: duplicate reports, wrong routing, unclear urgency, departmental silos, delayed action, and no reliable feedback loop. Our platform turns a complaint into an accountable workflow."

Demo disclosure: this revision demonstrates the web intake and deterministic offline intelligence fallback. Persistence, authentication, live email/PDF/OCR intake, embeddings, automated SLA escalation, and analytics dashboards are not enabled in this build.

## Demo 1 — student intake

Show:

- login;
- dashboard;
- previous and pending complaints;
- new complaint form.

Narration:

"The student does not need to know the internal institutional hierarchy. They simply describe the problem."

## Demo 2 — intelligence

Submit:

> "There has been no water in Hostel Block A since 8 AM and around 80 students are affected."

Show:

- Hostel classification;
- Water Supply subcategory;
- confidence;
- priority factors.

Narration:

"The AI does not simply label text. It extracts operational signals that influence urgency."

## Demo 3 — duplicate intelligence

Submit a second similar complaint.

Show:

- related/duplicate match;
- cluster;
- affected count;
- priority update.

Narration:

"Instead of creating two independent workloads, the system recognizes the shared issue while preserving both students' records."

## Demo 4 — routing (API-backed demo queue)

Show the Hostel queue.

Then explain that the same architecture works for Exam Cell and Academics/HOD.

## Demo 5 — accountability (lifecycle preview)

The current revision can show the assigned state and due timestamp. Do not claim a live background escalation worker or notification delivery.

Show:

- assigned staff;
- SLA deadline;
- escalation state.

Narration:

"Prioritization only matters if it changes operational behavior. Our SLA engine makes overdue work visible and escalates it."

## Demo 6 — resolution (API-backed lifecycle)

Resolve from department dashboard.

The API supports resolution, validation, and reopen. Persistence and notifications are not enabled in this revision.

Show:

- resolution;
- student notification;
- validation;
- archive/history.

## Closing — 30 seconds

"The output is not just a closed ticket. The institution now has a structured, auditable history of what students experience, how departments respond, where bottlenecks occur, and which problems repeat."
