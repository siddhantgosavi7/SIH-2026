import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, MessageSquareText, ShieldCheck, User, Building, AlertCircle, FileText, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { firstSuccessful } from '../../admin/adminApi';

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function AdminComplaintDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [nudging, setNudging] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await firstSuccessful(api, [`/complaints/${encodeURIComponent(id)}`, `/admin/complaints/${encodeURIComponent(id)}`], null);
        setComplaint(data);
        const tl = await api(`/complaints/${encodeURIComponent(id)}/timeline`).catch(() => []);
        setTimeline(tl);
      } catch (e) {
        setMessage(e.message || 'Unable to load complaint');
      }
    }
    load();
  }, [api, id, setMessage]);

  async function handleNudge() {
    setNudging(true);
    try {
      await api(`/admin/complaints/${encodeURIComponent(id)}/nudge`, { method: 'POST' });
      setMessage('Nudged the assigned department regarding this complaint.');
    } catch (e) {
      setMessage(e.message || 'Failed to send nudge');
    } finally {
      setNudging(false);
    }
  }

  if (!complaint) return <div className="admin-page"><div className="skeleton-panel" style={{ height: '300px' }}></div></div>;

  const overdue = complaint.sla_due_at && new Date(complaint.sla_due_at) < new Date() && complaint.status !== 'resolved';

  return (
    <div className="admin-page">
      <Link to="/admin/complaints" className="back-link">
        <ArrowLeft size={15} /> Back to complaints
      </Link>

      <section className="detail-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow-neon">COMPLAINT / {String(id).slice(0, 8)}</div>
          <h1>{complaint.title || 'Untitled Complaint'}</h1>
          <p>{complaint.description}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span className={`status-chip ${complaint.status}`}>{complaint.status || '—'}</span>
          {overdue && <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 800 }}>OVERDUE</span>}
        </div>
      </section>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="panel-eyebrow">METADATA</div>
          <h2>Classification</h2>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Metric icon={Building} label="Department" value={complaint.department || 'General'} />
            <Metric icon={AlertCircle} label="Priority" value={complaint.priority || 'Medium'} />
            <Metric icon={FileText} label="Category" value={complaint.category || '—'} />
            <Metric icon={MessageSquareText} label="Problem Group" value={complaint.problem_group_id ? String(complaint.problem_group_id).slice(0, 8) : 'Ungrouped'} />
            <Metric icon={Clock3} label="SLA Due" value={complaint.sla_due_at ? new Date(complaint.sla_due_at).toLocaleString() : '—'} />
            
            {(complaint.status === 'open' || complaint.status === 'in_progress') && (
              <button 
                onClick={handleNudge} 
                disabled={nudging}
                className="admin-button secondary" 
                style={{ marginTop: '8px', color: '#DC2626', borderColor: '#FCA5A5' }}
              >
                {nudging ? 'Sending...' : 'Escalate / Nudge Department'}
              </button>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-eyebrow">REPORTER</div>
          <h2>Student Details</h2>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Metric icon={User} label="Name" value={complaint.student_name || '—'} />
            <Metric icon={ShieldCheck} label="PRN" value={complaint.student_prn || '—'} />
            <Metric icon={Activity} label="Submitted" value={complaint.created_at ? new Date(complaint.created_at).toLocaleString() : '—'} />
          </div>
          
          {complaint.solution_text && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
              <div className="panel-eyebrow">RESOLUTION</div>
              <p style={{ fontSize: '13px', color: '#16A34A', fontWeight: 500, lineHeight: 1.6, marginTop: '8px' }}>
                {complaint.solution_text}
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="panel-eyebrow">AUDIT</div>
        <h2>Timeline</h2>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
          {timeline.length === 0 ? (
            <div className="empty-state">No timeline events found.</div>
          ) : timeline.map((event, i) => (
            <div key={event.id} style={{ display: 'flex', gap: '16px', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#000', marginTop: '3px' }} />
                {i < timeline.length - 1 && <div style={{ flex: 1, width: '1px', backgroundColor: '#E5E7EB', marginTop: '6px' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{event.action}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{timeAgo(event.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{value}</div>
      </div>
    </div>
  );
}
