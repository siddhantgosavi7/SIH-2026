const queue = [
  { id: "CMP-2026-000041", title: "No water in Hostel Block A", score: 86, reason: "80 students affected · SLA due in 3h", state: "UNASSIGNED" },
  { id: "CMP-2026-000044", title: "Room 203 electricity outage", score: 63, reason: "Safety signal · 4 students affected", state: "ASSIGNED" },
  { id: "CMP-2026-000038", title: "Hostel sanitation issue", score: 54, reason: "3 related reports", state: "IN PROGRESS" },
];

export default function DepartmentDashboard() {
  return <main className="shell">
    <nav className="topbar"><div className="brand"><span className="mark">↗</span> resolve</div><div className="role">Hostel staff · Department queue</div></nav>
    <section className="hero department-hero"><div><div className="eyebrow">Accountability workspace</div><h1>Resolve highest impact first.</h1><p className="lede">Priority, SLA risk, related reports, and history in one queue.</p></div><div className="hero-card"><div className="card-label">Today’s service level</div><div className="signal"><div><strong>Open queue</strong><span>Hostel department</span></div><div className="score">17</div></div><div className="signal"><div><strong>Due soon</strong><span>Requires action today</span></div><div className="score">04</div></div><div className="signal"><div><strong>SLA breached</strong><span>Escalated to supervisor</span></div><div className="score">01</div></div></div></section>
    <section className="dashboard"><div className="panel"><div className="panel-heading"><h2>Priority queue</h2><span className="pill">HOSTEL</span></div>{queue.map((item) => <article className="ticket" key={item.id}><div><h3>{item.id} · {item.title}</h3><p>{item.reason}</p></div><div className="ticket-meta"><div className="priority">{item.score}/100</div><span className="pill">{item.state}</span></div></article>)}</div><aside className="panel"><div className="panel-heading"><h2>How priority works</h2><span className="card-label">Explainable</span></div><div className="notice">Scores combine impact, urgency, affected students, SLA risk, and recurrence. Staff can correct routing; the decision remains in the audit history.</div><div className="signal"><div><strong>Related cluster</strong><span>Water supply · Block A</span></div><div className="score">14</div></div><div className="signal"><div><strong>Escalation policy</strong><span>Level 1 supervisor alert</span></div><span className="pill">ACTIVE</span></div></aside></section>
  </main>;
}
