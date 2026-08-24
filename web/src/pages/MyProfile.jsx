import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Shield, Trash2, Upload, UserPlus, Users, Activity,
  User as UserIcon, ChevronDown, ChevronUp, BookOpen, Pencil, Save, X,
  Eye, FileText, UserCheck, Clock, Calendar, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACADEMIC_DEPARTMENTS = [
  'Computer Science', 'Mechanical', 'Civil', 'Electronics', 'Information Technology', 'Chemical',
];
const DIVISIONS = ['A', 'B', 'C', 'D'];
const YEAR_SEMESTERS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year',
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester',
];

// ─── Student My Info Tab ──────────────────────────────────────────────────────
function StudentInfoTab({ api, setMessage }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prnError, setPrnError] = useState('');
  const [form, setForm] = useState({
    full_name: '', department: '', prn_number: '', division: '',
    roll_no: '', year_semester: '', contact_number: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const data = await api('/students/me/profile');
      setProfile(data);
      setForm({
        full_name: data.full_name,
        department: data.department,
        prn_number: data.prn_number,
        division: data.division,
        roll_no: data.roll_no,
        year_semester: data.year_semester || '',
        contact_number: data.contact_number || '',
      });
      setEditing(false);
    } catch (err) {
      // 404 = no profile yet, show empty form
      if (err.message?.includes('No academic profile')) {
        setProfile(null);
        setEditing(true);
      } else {
        setMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'prn_number') setPrnError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setPrnError('');

    // Client-side validation
    if (!form.full_name.trim() || !form.department || !form.prn_number.trim() || !form.division || !form.roll_no.trim()) {
      setMessage('Please fill in all required fields.');
      return;
    }
    if (!/^[0-9A-Za-z]{5,20}$/.test(form.prn_number.trim())) {
      setPrnError('PRN must be 5–20 alphanumeric characters.');
      return;
    }
    if (!/^[0-9]+$/.test(form.roll_no.trim())) {
      setMessage('Roll No must contain digits only.');
      return;
    }

    setSaving(true);
    try {
      const data = await api('/students/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          department: form.department,
          prn_number: form.prn_number.trim(),
          division: form.division,
          roll_no: form.roll_no.trim(),
          year_semester: form.year_semester || null,
          contact_number: form.contact_number || null,
        }),
      });
      setProfile(data);
      setEditing(false);
      setMessage('Academic profile saved!');
    } catch (err) {
      if (err.message?.includes('PRN already registered')) {
        setPrnError('This PRN is already registered to another account.');
      } else {
        setMessage(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="helper" style={{ padding: '24px 0' }}>Loading your academic profile…</p>;
  }

  // ── Read-only view ───────────────────────────────────────────────────────────
  if (profile && !editing) {
    return (
      <section className="panel" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BookOpen size={22} color="#176b87" />
          <h2 style={{ margin: 0 }}>Academic Profile</h2>
        </div>
        <p className="helper" style={{ marginBottom: '20px' }}>
          Your academic identity on record. Contact your institution to correct PRN or Roll No errors.
        </p>

        <div className="info-grid">
          {[
            ['Full Name', profile.full_name],
            ['Department', profile.department],
            ['PRN Number', profile.prn_number],
            ['Division', profile.division],
            ['Roll No', profile.roll_no],
            ['Year / Semester', profile.year_semester || '—'],
            ['Contact Number', profile.contact_number || '—'],
          ].map(([label, value]) => (
            <React.Fragment key={label}>
              <span className="info-label">{label}</span>
              <span style={{ fontWeight: 600, color: '#1d2630' }}>{value}</span>
            </React.Fragment>
          ))}
        </div>

        <button
          className="ghost"
          style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setEditing(true)}
        >
          <Pencil size={15} /> Edit
        </button>
      </section>
    );
  }

  // ── Edit / create form ───────────────────────────────────────────────────────
  return (
    <form className="panel form" style={{ maxWidth: '640px' }} onSubmit={handleSave}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BookOpen size={22} color="#176b87" />
        <h2 style={{ margin: 0 }}>
          {profile ? 'Edit Academic Profile' : 'Set Up Your Academic Profile'}
        </h2>
      </div>
      <p className="helper">
        {profile
          ? 'Update your academic identity details below.'
          : 'Fill in your academic details. Your institution uses this for grievance context.'}
      </p>

      {/* Full Name */}
      <label className="field-label">
        Full Name <span style={{ color: '#e11d48' }}>*</span>
      </label>
      <input name="full_name" placeholder="e.g. John Doe" required value={form.full_name} onChange={handleChange} />

      {/* Department */}
      <label className="field-label">
        Department <span style={{ color: '#e11d48' }}>*</span>
      </label>
      <select name="department" required value={form.department} onChange={handleChange}>
        <option value="">Select department…</option>
        {ACADEMIC_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      {/* PRN */}
      <label className="field-label">
        PRN Number <span style={{ color: '#e11d48' }}>*</span>
      </label>
      <input
        name="prn_number"
        placeholder="5–20 alphanumeric (e.g. 2024100012)"
        required
        value={form.prn_number}
        onChange={handleChange}
      />
      {prnError && <span className="field-error">{prnError}</span>}

      {/* Division */}
      <label className="field-label">
        Division <span style={{ color: '#e11d48' }}>*</span>
      </label>
      <select name="division" required value={form.division} onChange={handleChange}>
        <option value="">Select division…</option>
        {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      {/* Roll No */}
      <label className="field-label">
        Roll No <span style={{ color: '#e11d48' }}>*</span>
      </label>
      <input name="roll_no" placeholder="Digits only (e.g. 42)" required value={form.roll_no} onChange={handleChange} />

      {/* Year/Semester */}
      <label className="field-label">Year / Semester</label>
      <select name="year_semester" value={form.year_semester} onChange={handleChange}>
        <option value="">Select year or semester…</option>
        {YEAR_SEMESTERS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      {/* Contact */}
      <label className="field-label">Contact Number</label>
      <input name="contact_number" placeholder="e.g. +91 98765 43210" value={form.contact_number} onChange={handleChange} />

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
        </button>
        {profile && (
          <button type="button" className="ghost" onClick={() => { setEditing(false); setPrnError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <X size={15} /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Admin expandable user row ─────────────────────────────────────────────────
function AdminUserRow({ user, studentProfiles }) {
  const [open, setOpen] = useState(false);
  const profile = studentProfiles.find((p) => p.user_id === user.id) || null;

  return (
    <div
      style={{
        backgroundColor: '#F8FAFC',
        borderRadius: '12px',
        border: '1px solid #F1F5F9',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Compact row */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'inherit', gap: '10px',
        }}
      >
        <div style={{ textAlign: 'left', flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0B0B12', display: 'block' }}>
            {profile ? profile.full_name : user.email}
          </span>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Role: {user.role}
            {user.username ? ` · @${user.username}` : ''}
            {profile ? ` · PRN: ${profile.prn_number}` : ''}
          </span>
        </div>
        {open ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div
          style={{
            borderTop: '1px solid #E2E8F0',
            padding: '16px',
            background: '#ffffff',
          }}
        >
          {profile ? (
            <>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                Academic Profile — Read Only
              </p>
              <div className="info-grid">
                {[
                  ['Email', user.email],
                  ['Full Name', profile.full_name],
                  ['Department', profile.department],
                  ['PRN Number', profile.prn_number],
                  ['Division', profile.division],
                  ['Roll No', profile.roll_no],
                  ['Year / Semester', profile.year_semester || '—'],
                  ['Contact', profile.contact_number || '—'],
                ].map(([label, val]) => (
                  <React.Fragment key={label}>
                    <span className="info-label">{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1d2630' }}>{val}</span>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
              No academic profile submitted by this student yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function MyProfile() {
  const { session, cases, stats, setMessage, api, load, logout } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'my-info'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate('/');
  }

  useEffect(() => {
    if (session?.role === 'admin') {
      fetchAdminData();
    }
  }, [session]);

  async function fetchAdminData() {
    try {
      const users = await api('/users');
      setUsersList(users);
    } catch {
      setUsersList([
        { id: 1, email: 'admin@gmail.com', role: 'admin', department: 'Central' },
        { id: 2, email: 'student1@gmail.com', role: 'student', department: null },
      ]);
    }

    try {
      const logs = await api('/admin/audit-logs');
      setAuditLogs(logs);
    } catch {
      setAuditLogs([
        {
          id: 1, action: 'user.login', entity_type: 'user', entity_id: '1',
          event_metadata: { email: session?.email || 'admin@gmail.com' },
          created_at: new Date().toISOString(),
        },
      ]);
    }

    try {
      const profiles = await api('/admin/student-profiles');
      setStudentProfiles(profiles);
    } catch {
      setStudentProfiles([]);
    }
  }

  async function createComplaint(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await api('/complaints', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          department: form.get('department'),
          title: form.get('title'),
          description: form.get('description'),
          priority: form.get('priority'),
        }),
      });
      formEl.reset();
      setMessage('Complaint submitted successfully');
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function transition(id, status) {
    try {
      await api(`/complaints/${id}/transition`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setMessage(`Complaint ${status.replace('_', ' ')} successfully`);
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api(`/complaints/${id}`, { method: 'DELETE' });
      setMessage('Complaint deleted successfully');
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!session) return null;

  return (
    <main className="app">
      <header>
        <div>
          <p className="eyebrow">Grievance Intelligence &amp; Orchestration</p>
          <h1>
            {session.role === 'student'
              ? 'My grievance workspace'
              : session.role === 'admin'
              ? 'Central grievance control'
              : 'Department grievance queue'}
          </h1>
          <p>{session.username ? `Hi, ${session.username}` : 'Hi, User'}</p>
        </div>
        <button className="ghost" onClick={handleSignOut}>Sign out</button>
      </header>

      {stats && (
        <section className="stats">
          {['open', 'in_progress', 'escalated', 'resolved'].map((key) => (
            <div className="metric" key={key}>
              <span>{key.replace('_', ' ')}</span>
              <strong>{stats[key]}</strong>
            </div>
          ))}
        </section>
      )}

      {/* Tab Bar — student only */}
      {session.role === 'student' && (
        <div className="tab-bar">
          <button
            className={`tab${activeTab === 'grievances' ? ' active' : ''}`}
            onClick={() => setActiveTab('grievances')}
          >
            <Shield size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            My Grievances
          </button>
          <button
            className={`tab${activeTab === 'my-info' ? ' active' : ''}`}
            onClick={() => setActiveTab('my-info')}
          >
            <UserIcon size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            My Info
          </button>
        </div>
      )}

      {/* ── My Info Tab ─────────────────────────────────────────────────── */}
      {session.role === 'student' && activeTab === 'my-info' && (
        <div style={{ padding: '24px clamp(18px, 4vw, 48px)' }}>
          <StudentInfoTab api={api} setMessage={setMessage} />
        </div>
      )}

      {/* ── My Grievances Tab (+ non-student views) ─────────────────────── */}
      {(session.role !== 'student' || activeTab === 'grievances') && (
        <section className="layout">
          {session.role === 'student' && (
            <form className="panel form" onSubmit={createComplaint}>
              <ClipboardList size={22} />
              <h2>Submit a grievance</h2>
              <p className="helper">Describe issue clearly. Priority and routing remain subject to authorized review.</p>
              <select name="department" defaultValue="Hostel" required>
                <option value="Hostel">Hostel</option>
                <option value="CSE">CSE</option>
                <option value="AIML">AIML</option>
                <option value="CSBS">CSBS</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="ENTC">ENTC</option>
                <option value="Biotech">Biotech</option>
                <option value="Exam Cell">Exam Cell</option>
                <option value="Canteen">Canteen</option>
              </select>
              <input name="title" placeholder="Title" required />
              <textarea name="description" placeholder="Describe issue" required />
              <select name="priority" defaultValue="normal">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button>Create</button>
            </form>
          )}

          <section className="panel queue">
            <Shield size={22} />
            <h2>
              {session.role === 'student'
                ? 'My case history'
                : session.role === 'admin'
                ? 'All institutional cases'
                : 'My department queue'}
            </h2>
            <p className="helper">
              {session.role === 'student'
                ? 'Only you can see these cases.'
                : session.role === 'admin'
                ? 'Central administrators can oversee all cases.'
                : 'Server-side scope restricts this queue to your department.'}
            </p>
            <div className="cases">
              {cases.map((item) => (
                <article
                  className="case"
                  key={item.id}
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onClick={() => setSelectedComplaint(item)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.title}</strong>
                      <span className={`badge-status ${item.status}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Submitter Identity Badge Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                      <span>Dept: <strong>{item.department}</strong></span>
                      <span>Priority: <strong>{item.priority}</strong></span>
                      <span style={{ color: '#0d9488', fontWeight: 600, background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                        👤 {item.student_name || 'Student'} (PRN: {item.student_prn || 'N/A'} · Div: {item.student_division || '—'} · Roll: {item.student_roll_no || '—'})
                      </span>
                    </div>

                    {/* Issue Description Preview snippet */}
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                      {item.description ? (item.description.length > 90 ? item.description.substring(0, 90) + '...' : item.description) : 'No description'}
                    </p>
                  </div>

                  <div className="actions" onClick={(e) => e.stopPropagation()}>
                    <button className="ghost" title="View Full Details" onClick={() => setSelectedComplaint(item)}>
                      <Eye size={16} />
                    </button>
                    {session.role !== 'student' && item.status !== 'closed' && (
                      <>
                        <button title="Start work" onClick={() => transition(item.id, 'in_progress')}><UserPlus size={16} /></button>
                        <button title="Resolve" onClick={() => transition(item.id, 'resolved')}><Upload size={16} /></button>
                      </>
                    )}
                    {(session.role === 'student' || item.status === 'resolved' || item.status === 'closed') && (
                      <button className="btn-delete" title="Delete complaint" onClick={() => deleteComplaint(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {/* ── Complaint Detail Modal Overlay ─────────────────────────────── */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className={`badge-status ${selectedComplaint.status}`}>
                    {selectedComplaint.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                    Priority: {selectedComplaint.priority}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                    ID: {selectedComplaint.id.substring(0, 8)}...
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedComplaint.title}
                </h2>
              </div>
              <button
                className="ghost"
                onClick={() => setSelectedComplaint(null)}
                style={{ minHeight: 'auto', padding: '6px', borderRadius: '50%', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Describe Issue Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#176b87', fontWeight: 700, fontSize: '14px' }}>
                  <FileText size={18} />
                  <span>Described Issue / Full Complaint Details</span>
                </div>
                <div className="issue-box">
                  {selectedComplaint.description || 'No description provided.'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                  <span>Department: <strong>{selectedComplaint.department}</strong></span>
                  {selectedComplaint.category && <span>Category: <strong>{selectedComplaint.category}</strong></span>}
                  {selectedComplaint.created_at && (
                    <span>Filed: <strong>{new Date(selectedComplaint.created_at).toLocaleString()}</strong></span>
                  )}
                  {selectedComplaint.sla_due_at && (
                    <span>SLA Due: <strong>{new Date(selectedComplaint.sla_due_at).toLocaleString()}</strong></span>
                  )}
                </div>
              </div>

              {/* Submitter Info Card (Who sent this complaint) */}
              <div className="submitter-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0d9488', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <UserCheck size={18} />
                  <span>Submitter Profile &amp; Academic Identity</span>
                </div>
                <div className="info-grid">
                  <span className="info-label">Full Name:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedComplaint.student_name || 'Registered Student'}
                  </span>

                  <span className="info-label">PRN Number:</span>
                  <span>
                    <span className="badge-prn">
                      {selectedComplaint.student_prn || 'N/A'}
                    </span>
                  </span>

                  <span className="info-label">Division:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedComplaint.student_division || 'N/A'}
                  </span>

                  <span className="info-label">Roll No:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedComplaint.student_roll_no || 'N/A'}
                  </span>

                  <span className="info-label">Department:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedComplaint.student_department || selectedComplaint.department}
                  </span>

                  <span className="info-label">Year / Semester:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedComplaint.student_year_semester || 'N/A'}
                  </span>

                  <span className="info-label">Contact No:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedComplaint.student_contact || 'N/A'}
                  </span>

                  <span className="info-label">Email Address:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedComplaint.student_email || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {session.role !== 'student' && selectedComplaint.status !== 'closed' && (
                <>
                  {selectedComplaint.status === 'open' && (
                    <button
                      onClick={() => {
                        transition(selectedComplaint.id, 'in_progress');
                        setSelectedComplaint(null);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
                    >
                      <UserPlus size={16} /> Start Resolution
                    </button>
                  )}
                  {selectedComplaint.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        transition(selectedComplaint.id, 'resolved');
                        setSelectedComplaint(null);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#059669' }}
                    >
                      <Upload size={16} /> Mark Resolved
                    </button>
                  )}
                </>
              )}
              <button className="ghost" onClick={() => setSelectedComplaint(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Panel ─────────────────────────────────────────────────── */}
      {session.role === 'admin' && (
        <section
          style={{
            marginTop: '28px',
            padding: '0 clamp(18px, 4vw, 48px) 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Left Card: Audit Logs */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #E2E8F0' }}>
            <Activity size={24} color="#0D9488" style={{ marginBottom: '8px', display: 'block' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B0B12', margin: '0 0 4px 0' }}>
              System Audit &amp; Sign-in Activity Logs
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 20px 0' }}>
              Tracks user sign-ins, registrations, and administrative events.
            </p>
            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {auditLogs.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#94A3B8', fontStyle: 'italic' }}>No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => {
                  const actorEmail = log.event_metadata?.email
                    || (log.event_metadata?.username ? log.event_metadata.username : `User #${log.actor_id || log.entity_id}`);
                  const formattedTime = new Date(log.created_at).toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  });
                  return (
                    <div key={log.id} style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#0B0B12' }}>{log.action} — {actorEmail}</span>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>Entity: {log.entity_type} · Time: {formattedTime}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Card: Registered Users with expandable student profiles */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #E2E8F0' }}>
            <Users size={24} color="#0D9488" style={{ marginBottom: '8px', display: 'block' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B0B12', margin: '0 0 4px 0' }}>
              Registered Users
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 6px 0' }}>
              Click a row to view academic profile details.
            </p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 20px 0' }}>
              {studentProfiles.length} of {usersList.length} user{usersList.length !== 1 ? 's' : ''} have submitted academic profiles.
            </p>
            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {usersList.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#94A3B8', fontStyle: 'italic' }}>No registered users found.</p>
              ) : (
                usersList.map((user) => (
                  <AdminUserRow key={user.id} user={user} studentProfiles={studentProfiles} />
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
