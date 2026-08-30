import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Clock3, Layers3, UsersRound, AlertTriangle, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { asArray, firstSuccessful, normalizeDashboard, problemKey } from '../../admin/adminApi';

export function AdminHome() {
  const { api, setMessage } = useAuth();
  const [data, setData] = React.useState({ stats: normalizeDashboard(), problems: [], complaints: [], departments: [] });
  const [loading, setLoading] = React.useState(true);
  const [checkingSla, setCheckingSla] = React.useState(false);
  const [nudging, setNudging] = React.useState({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, problemData, complaintData, deptData] = await Promise.all([
        firstSuccessful(api, ['/admin/dashboard', '/dashboard/admin'], {}),
        firstSuccessful(api, ['/staff/problems', '/admin/problems'], []),
        firstSuccessful(api, ['/admin/complaints', '/complaints'], []),
        api('/admin/departments/overview').catch(() => [])
      ]);
      const complaints = asArray(complaintData);
      const problems = asArray(problemData);
      const departments = asArray(deptData);
      setData({ stats: normalizeDashboard(dashboard, complaints, problems), problems, complaints, departments });
    } catch (error) {
      setMessage(error.message || 'Unable to load admin dashboard');
    } finally { setLoading(false); }
  }, [api, setMessage]);

  React.useEffect(() => { load(); }, [load]);

  const s = data.stats;
  const statCards = [
    { label: 'Core problems', value: s.core_problems, icon: Layers3, note: 'AI-grouped institutional issues' },
    { label: 'Open complaints', value: s.open, icon: Clock3, note: 'Awaiting active resolution' },
    { label: 'Resolved', value: s.resolved, icon: CheckCircle2, note: 'Closed or marked resolved' },
    { label: 'Affected students', value: s.affected_students || '—', icon: UsersRound, note: 'Across detected problem groups' },
  ];

  const resolutionData = [
    { name: 'Mon', avgTime: 24 }, { name: 'Tue', avgTime: 28 },
    { name: 'Wed', avgTime: 22 }, { name: 'Thu', avgTime: 35 },
    { name: 'Fri', avgTime: 18 }, { name: 'Sat', avgTime: 42 },
    { name: 'Sun', avgTime: 38 }
  ];
  
  const trendsData = [
    { category: 'Hostel', frequency: 45 }, { category: 'Academics', frequency: 32 },
    { category: 'IT', frequency: 28 }, { category: 'Facilities', frequency: 15 }
  ];

  async function triggerSlaCheck() {
    setCheckingSla(true);
    try {
      await api('/admin/sla-check', { method: 'POST' });
      setMessage('SLA check completed. Overdue issues updated.');
      load();
    } catch (err) {
      setMessage(err.message || 'SLA check failed');
    } finally { setCheckingSla(false); }
  }

  async function nudgeDepartment(dept) {
    if (!dept) return;
    setNudging(prev => ({ ...prev, [dept]: true }));
    try {
      await api(`/admin/departments/${encodeURIComponent(dept)}/nudge`, { method: 'POST' });
      setMessage(`Nudged ${dept} department`);
    } catch (err) {
      setMessage(err.message || 'Nudge failed');
    } finally { setNudging(prev => ({ ...prev, [dept]: false })); }
  }

  const recentProblems = data.problems.slice(0, 5);
  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <div className="eyebrow-neon">CONTROL / OVERVIEW</div>
          <h1>Good evening, Administrator.</h1>
          <p>See the institution as a set of real problems, not hundreds of duplicate complaints.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-button secondary" onClick={triggerSlaCheck} disabled={checkingSla}>
            <Clock3 size={15} /> {checkingSla ? 'Checking...' : 'Run SLA Check'}
          </button>
          <button className="admin-button secondary" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </section>

      <section className="admin-stat-grid">
        {statCards.map(({ label, value, icon: Icon, note }) => (
          <div className="admin-stat-card" key={label}>
            <div className="stat-icon"><Icon size={17} /></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{loading ? '…' : value}</div>
            <div className="stat-note">{note}</div>
          </div>
        ))}
      </section>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="panel-heading">
            <div><div className="panel-eyebrow">AI TRIAGE</div><h2>Core problems</h2></div>
            <Link to="/admin/problems" className="panel-link">View all <ArrowUpRight size={14} /></Link>
          </div>
          <div className="problem-list compact">
            {recentProblems.length ? recentProblems.map((p) => (
              <Link className="problem-row" key={problemKey(p)} to={`/admin/problems/${encodeURIComponent(problemKey(p))}`}>
                <div className="problem-dot" />
                <div className="problem-main"><strong>{p.title || p.name || p.problem_code || 'Untitled core problem'}</strong><span>{p.department || 'Unassigned'} · {p.complaint_count ?? p.affected_users ?? '—'} affected</span></div>
                <PriorityBadge value={p.priority} />
                <ArrowUpRight size={15} />
              </Link>
            )) : <Empty text={loading ? 'Loading problem groups…' : 'No core problems returned yet.'} />}
          </div>
        </section>

        <section className="admin-panel attention-panel">
          <div className="panel-heading"><div><div className="panel-eyebrow">ATTENTION</div><h2>Resolution health</h2></div></div>
          <div className="health-metric"><span>Open workload</span><strong>{s.open}</strong></div>
          <div className="health-bar"><span style={{ width: `${Math.min(100, s.total ? (s.open / s.total) * 100 : 0)}%` }} /></div>
          <div className="health-metric"><span>In progress</span><strong>{s.in_progress}</strong></div>
          <div className="health-metric"><span>Overdue</span><strong className={s.overdue ? 'danger-text' : ''}>{s.overdue}</strong></div>
          {s.overdue > 0 && <div className="alert-box"><AlertTriangle size={16} /><span>{s.overdue} item(s) need immediate administrative attention.</span></div>}
        </section>
      </div>

      <section className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="panel-heading">
          <div><div className="panel-eyebrow">ANALYTICS</div><h2>Resolution Speed</h2></div>
        </div>
        <div style={{ height: '300px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={resolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
              <Tooltip contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="avgTime" stroke="#000000" strokeWidth={3} dot={{ r: 4, fill: '#000000', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="admin-grid-2" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <section className="admin-panel">
          <div className="panel-heading">
            <div><div className="panel-eyebrow">TRENDS</div><h2>Recurring Issues</h2></div>
          </div>
          <div style={{ height: '250px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="category" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="frequency" fill="#4B5563" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-heading">
            <div><div className="panel-eyebrow">ALERTS</div><h2>Department SLAs</h2></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {data.departments.length === 0 ? <Empty text="No department data found" /> : data.departments.map((b, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
                backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
                borderLeft: b.overdue > 0 ? '4px solid #DC2626' : '1px solid #E5E7EB',
                fontWeight: b.overdue > 0 ? 700 : 500, color: b.overdue > 0 ? '#DC2626' : '#4B5563',
                borderRadius: '4px'
              }}>
                <div>
                  <span style={{ color: '#000' }}>{b.department}</span>
                  <span style={{ fontSize: '12px', marginLeft: '8px', color: '#6B7280', fontWeight: 500 }}>
                    {b.open} open {b.overdue > 0 && <span style={{ color: '#DC2626' }}>({b.overdue} overdue)</span>}
                  </span>
                </div>
                {b.overdue > 0 && (
                  <button
                    onClick={() => nudgeDepartment(b.department)}
                    disabled={nudging[b.department]}
                    className="admin-button secondary"
                    style={{ padding: '4px 10px', fontSize: '11px', color: '#DC2626', borderColor: '#FCA5A5' }}
                  >
                    {nudging[b.department] ? 'Nudging...' : 'Nudge'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PriorityBadge({ value }) {
  const v = String(value || 'LOW').toUpperCase();
  return <span className={`priority-badge ${v.toLowerCase()}`}>{v}</span>;
}
function Empty({ text }) { return <div className="empty-state">{text}</div>; }
