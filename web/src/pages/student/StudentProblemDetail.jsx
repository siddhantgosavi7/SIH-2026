import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { groupStudentComplaints } from '../../api/problems';

export function StudentProblemDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/complaints').then((data) => {
      const groups = groupStudentComplaints(Array.isArray(data) ? data : data?.items || []);
      setProblem(groups.find((x) => String(x.id) === String(id)) || null);
    }).catch((error) => setMessage(error.message || 'Unable to load problem.'))
      .finally(() => setLoading(false));
  }, [api, id, setMessage]);

  if (loading) return <div className="admin-page"><div className="skeleton-panel">Loading problem…</div></div>;
  if (!problem) return <div className="admin-page"><Link to="/student/problems" className="back-link"><ArrowLeft size={15} /> Back</Link><div className="empty-state">This problem group was not found in your complaints.</div></div>;

  return <div className="admin-page"><Link to="/student/problems" className="back-link"><ArrowLeft size={15} /> Back to problem groups</Link><section className="detail-hero"><div><div className="eyebrow-neon">{problem.problem_code || 'PROBLEM GROUP'}</div><h1>{problem.title}</h1><p>{problem.description || 'Grouped issue attached to your complaint history.'}</p></div><span className={`priority-badge ${String(problem.priority || 'low').toLowerCase()}`}>{problem.priority || '—'}</span></section><section className="detail-stats"><Metric icon={Users} label="Your reports" value={problem.complaint_count} /><Metric icon={FileText} label="Department" value={problem.department || 'Pending'} /><Metric icon={FileText} label="Status" value={String(problem.status || 'open').replaceAll('_', ' ')} /></section><section className="admin-panel"><div className="panel-eyebrow">YOUR COMPLAINTS IN THIS GROUP</div>{problem.complaints.map((c) => <Link className="student-row" key={c.id} to={`/student/complaints/${encodeURIComponent(c.id)}`}><i className="student-dot" /><div><strong>{c.title || 'Complaint'}</strong><span>{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</span></div></Link>)}</section></div>;
}
function Metric({ icon: Icon, label, value }) { return <div className="detail-stat"><Icon size={16} /><span>{label}</span><strong>{value}</strong></div>; }
