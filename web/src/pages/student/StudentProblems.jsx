import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { groupStudentComplaints } from '../../api/problems';

const text = (v) => String(v ?? '');
const normal = (v) => text(v).toLowerCase();

export function StudentProblems() {
  const { api, setMessage } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/complaints').then((data) => setComplaints(Array.isArray(data) ? data : data?.items || data?.results || []))
      .catch((error) => setMessage(error.message || 'Unable to load problem groups.'))
      .finally(() => setLoading(false));
  }, [api, setMessage]);

  const problems = useMemo(() => groupStudentComplaints(complaints), [complaints]);
  const departments = useMemo(() => [...new Set(problems.map((p) => p.department).filter(Boolean))].sort(), [problems]);
  const visible = useMemo(() => problems.filter((p) => {
    const haystack = normal(`${p.problem_code || ''} ${p.title || ''} ${p.description || ''} ${p.department || ''}`);
    return (!query.trim() || haystack.includes(normal(query.trim()))) && (department === 'all' || p.department === department) && (status === 'all' || normal(p.status) === status);
  }), [problems, query, department, status]);

  return <div className="admin-page">
    <section className="student-hero"><div><div className="admin-kicker">PROBLEM GROUPS</div><h1>Problems linked to your reports.</h1><p>These groups are derived from the problem_group_id returned by the current FastAPI complaint API.</p></div></section>
    <section className="problem-discovery-callout"><div className="problem-discovery-icon"><Sparkles size={17} /></div><div><strong>One institutional problem can contain many reports.</strong><span>The backend currently exposes problem groups to staff; students can see the groups attached to their own complaints.</span></div></section>
    <div className="admin-toolbar problem-discovery-toolbar"><div className="search-wrap wide"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search problem or department…" /></div><div className="filter-wrap"><Filter size={14} /><select value={department} onChange={(e) => setDepartment(e.target.value)}><option value="all">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All status</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></div>
    <section className="problem-list large">{visible.map((p) => <Link className="problem-card" key={p.id} to={`/student/problems/${encodeURIComponent(p.id)}`}><div className="problem-card-top"><span className="problem-code">{p.problem_code || `GROUP-${String(p.id).slice(0, 8)}`}</span><span className={`priority-badge ${normal(p.priority || 'low')}`}>{p.priority || '—'}</span></div><h2>{p.title}</h2><p>{p.description || 'No description supplied.'}</p><div className="problem-meta"><span><strong>{p.complaint_count}</strong> of your complaints</span><span>{p.department || 'Department pending'}</span><span>{text(p.status || 'open').replaceAll('_', ' ')}</span></div></Link>)}{!visible.length && <div className="empty-state panel-empty">{loading ? 'Loading problem groups…' : 'No problem groups match these filters.'}</div>}</section>
  </div>;
}
