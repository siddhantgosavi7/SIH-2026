import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, firstSuccessful, problemKey } from '../../admin/adminApi';

export function AdminProblems() {
  const { api, setMessage } = useAuth();
  const [problems, setProblems] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [priority, setPriority] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setProblems(asArray(await firstSuccessful(api, ['/staff/problems', '/admin/problems'], []))); }
    catch (e) { setMessage(e.message || 'Unable to load core problems'); }
    finally { setLoading(false); }
  }, [api, setMessage]);
  React.useEffect(() => { load(); }, [load]);

  const filtered = problems.filter(p => {
    const text = `${p.title || ''} ${p.problem_code || ''} ${p.department || ''}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (priority === 'all' || String(p.priority).toLowerCase() === priority) && (status === 'all' || String(p.status).toLowerCase() === status);
  });

  return <div className="admin-page">
    <section className="admin-hero page-hero"><div><div className="eyebrow-neon">AI-GROUPED ISSUES</div><h1>Core problems</h1><p>One institutional problem can represent dozens of related student complaints.</p></div><button className="admin-button secondary" onClick={load}><RefreshCw size={15} /> Refresh</button></section>
    <section className="admin-toolbar"><div className="search-wrap"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search problem, code, or department…" /></div><div className="filter-wrap"><SlidersHorizontal size={15} /><select value={priority} onChange={e => setPriority(e.target.value)}><option value="all">All priorities</option><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All status</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></div></section>
    <section className="problem-list large">
      {filtered.map(p => <Link className="problem-card" key={problemKey(p)} to={`/admin/problems/${encodeURIComponent(problemKey(p))}`}>
        <div className="problem-card-top"><span className="problem-code">{p.problem_code || `PG-${String(problemKey(p)).slice(0, 8)}`}</span><PriorityBadge value={p.priority} /></div>
        <h2>{p.title || p.name || 'Untitled core problem'}</h2>
        <p>{p.description || 'Grouped complaints indicate a shared institutional issue requiring one coordinated response.'}</p>
        <div className="problem-meta"><span><strong>{p.complaint_count ?? p.affected_users ?? 0}</strong> affected</span><span>{p.department || 'Unassigned department'}</span><span className={`status-dot ${String(p.status || 'open').toLowerCase()}`}>{String(p.status || 'OPEN').replaceAll('_', ' ')}</span><ArrowUpRight size={16} /></div>
      </Link>)}
      {!filtered.length && <div className="empty-state panel-empty">{loading ? 'Loading core problems…' : 'No core problems match these filters.'}</div>}
    </section>
  </div>;
}

function PriorityBadge({ value }) { const v = String(value || 'LOW').toUpperCase(); return <span className={`priority-badge ${v.toLowerCase()}`}>{v}</span>; }
