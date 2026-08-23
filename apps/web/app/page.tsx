"use client";

import { FormEvent, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function Home() {
  const [text, setText] = useState("");
  const [affectedUsers, setAffectedUsers] = useState("1");
  const [notice, setNotice] = useState("AI triage is ready. Submit a complaint to see a live decision.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Processing complaint and looking for related reports…");
    try {
      const token = localStorage.getItem("resolve_access_token");
      if (!token) return setNotice("Sign in before submitting a complaint.");
      const response = await fetch(`${apiBase}/complaints`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ text, affected_users: Number(affectedUsers) || 1 }) });
      if (!response.ok) throw new Error("API unavailable");
      const result = await response.json();
      setNotice(`${result.complaint_id} created — ${result.status.replaceAll("_", " ")}. Your department queue has been notified.`);
      setText("");
    } catch { setNotice("Demo mode: the API is not connected yet. Start the FastAPI service on port 8000, then try again."); }
  }

  return <main className="shell">
    <nav className="topbar"><div className="brand"><span className="mark">↗</span> resolve</div><a className="role" href="/login">Student sign in</a></nav>
    <section className="hero"><div><div className="eyebrow">Grievance intelligence platform</div><h1>Make every concern count.</h1><p className="lede">One accountable workflow for student complaints — from the first sentence to a verified resolution.</p></div><div className="hero-card"><div className="card-label">What happens after you submit</div><div className="signal"><div><strong>AI classification</strong><span>Hostel · Water supply</span></div><div className="score">96%</div></div><div className="signal"><div><strong>Explainable priority</strong><span>80 students · exam deadline</span></div><div className="score">86</div></div><div className="signal"><div><strong>Routing</strong><span>Hostel queue · SLA in 4 hours</span></div><span className="pill">ON TRACK</span></div></div></section>
    <section className="dashboard"><div><div className="metrics"><div className="metric"><small>My active cases</small><strong>03</strong></div><div className="metric"><small>Avg. response</small><strong>2.4h</strong></div><div className="metric"><small>Resolved this term</small><strong>12</strong></div></div><div className="panel"><div className="panel-heading"><h2>Recent activity</h2><span className="pill">LIVE QUEUE</span></div><div className="ticket"><div><h3>CMP-2026-000041 · Hostel water supply</h3><p>80 students affected · Hostel department · Updated 18 min ago</p></div><div className="ticket-meta"><div className="priority">HIGH</div><span className="pill">ASSIGNED</span></div></div><div className="ticket"><div><h3>CMP-2026-000038 · Result discrepancy</h3><p>Exam Cell · Resolution awaiting your validation</p></div><div className="ticket-meta"><span className="pill">REVIEW</span></div></div></div></div><div className="panel"><div className="panel-heading"><h2>Report a concern</h2><span className="card-label">Takes 2 min</span></div><form onSubmit={submit}><label>What happened?<textarea required minLength={20} value={text} onChange={(event) => setText(event.target.value)} placeholder="Describe the issue, location, and when it started…" rows={5} /></label><label>How many people are affected?<input type="number" min={1} max={100000} value={affectedUsers} onChange={(event) => setAffectedUsers(event.target.value)} /></label><button className="submit" type="submit">Submit complaint →</button><div className="notice">{notice}</div></form></div></section>
  </main>;
}
