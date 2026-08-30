import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Send, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, firstSuccessful } from '../../admin/adminApi';

export function AdminProblemDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  const [problem, setProblem] = React.useState(null);
  const [complaints, setComplaints] = React.useState([]);
  const [solution, setSolution] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, all] = await Promise.all([
        firstSuccessful(api, [`/staff/problems/${encodeURIComponent(id)}`, `/admin/problems/${encodeURIComponent(id)}`], null),
        firstSuccessful(api, ['/admin/complaints', '/complaints'], []),
      ]);
      setProblem(p);
      const list = asArray(all);
      setComplaints(list.filter(c => String(c.problem_group_id ?? c.problem_id ?? '') === String(id)));
    } catch (e) { setMessage(e.message || 'Unable to load problem'); }
    finally { setLoading(false); }
  }, [api, id, setMessage]);
  React.useEffect(() => { load(); }, [load]);

  async function sendSolution(markResolved = false) {
    if (!solution.trim()) return setMessage('Write a solution before submitting.');
    setSaving(true);
    try {
      await api(`/staff/problems/${encodeURIComponent(id)}/solution`, { method: 'PUT', body: JSON.stringify({ solution: solution.trim(), status: markResolved ? 'resolved' : 'in_progress' }) });
      setMessage(markResolved ? 'Solution submitted and problem marked resolved.' : 'Solution submitted to the department pipeline.');
      load();
    } catch (e) { setMessage(e.message || 'Could not submit solution'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="admin-page"><div className="skeleton-panel">Loading core problem…</div></div>;
  if (!problem) return <div className="admin-page"><div className="empty-state">Core problem not found.</div></div>;

  const affected = problem.complaint_count ?? problem.affected_users ?? complaints.length ?? 0;
  return <div className="admin-page">
    <Link to="/admin/problems" className="back-link"><ArrowLeft size={15} /> Back to core problems</Link>
    <section className="detail-hero">
      <div><div className="eyebrow-neon">{problem.problem_code || `PROBLEM / ${String(id).slice(0, 8)}`}</div><h1>{problem.title || problem.name || 'Core problem'}</h1><p>{problem.description || 'AI-grouped institutional issue.'}</p></div>
      <span className={`priority-badge ${String(problem.priority || 'low').toLowerCase()}`}>{String(problem.priority || 'LOW').toUpperCase()}</span>
    </section>
    <section className="detail-stats">
      <Metric icon={Users} label="Affected students" value={affected} /><Metric icon={FileText} label="Grouped complaints" value={complaints.length || affected} /><Metric icon={Sparkles} label="Department" value={problem.department || 'Unassigned'} /><Metric icon={CheckCircle2} label="Status" value={String(problem.status || 'OPEN').replaceAll('_', ' ')} />
    </section>
    <div className="admin-grid-2 detail-grid">
      <section className="admin-panel"><div className="panel-eyebrow">AI SUMMARY</div><h2>Institutional context</h2><p className="detail-copy">{problem.summary || problem.ai_summary || problem.description || 'The similarity engine has grouped related complaints into this single operational problem. Review the evidence below and issue one coordinated response.'}</p><div className="ai-callout"><Sparkles size={17} /><span>This view represents the <strong>core problem</strong>, not every duplicate student report.</span></div></section>
      <section className="admin-panel solution-panel"><div className="panel-eyebrow">ADMIN ACTION</div><h2>Issue a solution</h2><textarea value={solution} onChange={e => setSolution(e.target.value)} placeholder="Write the resolution or instruction that should be communicated to the affected students…" /><div className="solution-actions"><button className="admin-button secondary" disabled={saving} onClick={() => sendSolution(false)}><Send size={15} /> {saving ? 'Submitting…' : 'Submit solution'}</button><button className="admin-button primary" disabled={saving} onClick={() => sendSolution(true)}><CheckCircle2 size={15} /> Mark resolved</button></div></section>
    </div>
    <section className="admin-panel"><div className="panel-heading"><div><div className="panel-eyebrow">EVIDENCE</div><h2>Related complaints</h2></div><span className="count-pill">{complaints.length}</span></div><div className="complaint-mini-list">{complaints.slice(0, 20).map(c => <div className="complaint-mini" key={c.id}><span className="mono">#{String(c.id).slice(0, 8)}</span><strong>{c.title || 'Complaint'}</strong><span>{c.status || '—'}</span></div>)}{!complaints.length && <div className="empty-state">The backend did not return individual complaints linked to this problem group.</div>}</div></section>
  </div>;
}
function Metric({ icon: Icon, label, value }) { return <div className="detail-stat"><Icon size={16} /><span>{label}</span><strong>{value}</strong></div>; }
