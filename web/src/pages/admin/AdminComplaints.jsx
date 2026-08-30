import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, firstSuccessful } from './adminApi';

export function AdminComplaints() {
  const { api, setMessage } = useAuth();
  const [items, setItems] = React.useState([]); const [q, setQ] = React.useState(''); const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => { setLoading(true); try { setItems(asArray(await firstSuccessful(api, ['/admin/complaints', '/complaints'], []))); } catch(e) { setMessage(e.message || 'Unable to load complaints'); } finally { setLoading(false); } }, [api, setMessage]);
  React.useEffect(() => { load(); }, [load]);
  const filtered = items.filter(c => `${c.title || ''} ${c.description || ''} ${c.department || ''} ${c.id || ''}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="admin-page"><section className="admin-hero page-hero"><div><div className="eyebrow-neon">RAW CASES</div><h1>Complaints</h1><p>Inspect individual student submissions behind the grouped problem view.</p></div><button className="admin-button secondary" onClick={load}><RefreshCw size={15} /> Refresh</button></section><section className="admin-toolbar"><div className="search-wrap wide"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, description, department, or ID…" /></div></section><section className="admin-table-panel"><table className="admin-table"><thead><tr><th>ID</th><th>Complaint</th><th>Department</th><th>Priority</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{filtered.map(c => <tr key={c.id}><td className="mono">#{String(c.id).slice(0,8)}</td><td><strong>{c.title || 'Untitled complaint'}</strong><span className="table-sub">{c.description ? String(c.description).slice(0, 80) : 'No description'}</span></td><td>{c.department || '—'}</td><td><PriorityBadge value={c.priority} /></td><td><span className="status-chip">{c.status || '—'}</span></td><td className="mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td><td><Link className="icon-link" to={`/admin/complaints/${encodeURIComponent(c.id)}`}><ArrowUpRight size={16}/></Link></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state">{loading ? 'Loading complaints…' : 'No complaints found.'}</div>}</section></div>;
}
function PriorityBadge({value}) { const v=String(value||'LOW').toUpperCase(); return <span className={`priority-badge ${v.toLowerCase()}`}>{v}</span>; }
