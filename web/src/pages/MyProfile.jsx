import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Shield, Trash2, Upload, UserPlus, Users, Activity,
  User as UserIcon, ChevronDown, ChevronUp, BookOpen, Pencil, Save, X,
  Eye, FileText, UserCheck, Clock, Calendar, AlertCircle, MessageSquare, Send, Mail,
  Search, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';

// ─── Constants ────────────────────────────────────────────────────────────────
const DIVISIONS = ['A', 'B', 'C', 'D'];
const YEAR_SEMESTERS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year',
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester',
];

// ─── Case progress timeline ───────────────────────────────────────────────────
const CASE_STEPS = ['Submitted', 'Department Review', 'Action Taken', 'Resolved'];

// Returns 'done' | 'current' | 'pending' | 'resolved-done' for each of the 4 steps
function getTimelineStates(status) {
  let currentIndex;
  if (status === 'in_progress' || status === 'escalated') currentIndex = 2;
  else if (status === 'resolved' || status === 'closed') currentIndex = 3;
  else currentIndex = 1; // 'open' and any unrecognised status

  return CASE_STEPS.map((_, i) => {
    if (currentIndex === 3 && i === 3) return 'resolved-done';
    if (i < currentIndex) return 'done';
    if (i === currentIndex) return 'current';
    return 'pending';
  });
}

// ─── Student My Info Tab ──────────────────────────────────────────────────────
function StudentInfoTab({ api, setMessage, onProfileSaved }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prnError, setPrnError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    full_name: '', department: '', prn_number: '', division: '',
    roll_no: '', year_semester: '', contact_number: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      const data = await api('/departments');
      setDepartments(data);
    } catch (e) { console.error('Failed to load departments', e); }
  }

  async function fetchProfile() {
    setLoading(true);
    try {
      const data = await api('/students/me/profile');
      setProfile(data);
      if (onProfileSaved) onProfileSaved(data);
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
      if (onProfileSaved) onProfileSaved(data);
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
          <BookOpen size={22} color="#000000" />
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
              <span style={{ fontWeight: 600, color: '#1F2937' }}>{value}</span>
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
        <BookOpen size={22} color="#000000" />
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
        {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
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
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
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
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#000000', display: 'block' }}>
            {profile ? profile.full_name : user.email}
          </span>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            Role: {user.role}
            {user.username ? ` · @${user.username}` : ''}
            {profile ? ` · PRN: ${profile.prn_number}` : ''}
          </span>
        </div>
        {open ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
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
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1F2937' }}>{val}</span>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
              No academic profile submitted by this student yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Message Modal Component ──────────────────────────────────────────────────
function MessageModal({ recipient, complaint, api, setMessage, onClose }) {
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) {
      setMessage('Please enter a message');
      return;
    }
    setSending(true);
    try {
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: recipient.id,
          complaint_id: complaint?.id || null,
          subject: subject.trim() || null,
          body: body.trim(),
        }),
      });
      setMessage('Message sent successfully');
      onClose();
    } catch (err) {
      setMessage(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color="#000000" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Send Message</h2>
          </div>
          <button className="ghost" onClick={onClose} style={{ minHeight: 'auto', padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSend}>
          <div className="modal-body">
            <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>TO:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#000000', marginLeft: '8px' }}>
                {recipient.full_name || recipient.username || recipient.email}
              </span>
              {complaint && (
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Re: {complaint.title}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '12px', fontSize: '14px' }}
            />
            <textarea
              placeholder="Type your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical' }}
            />
          </div>
          <div className="modal-footer">
            <button
              type="submit"
              disabled={sending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#000000' }}
            >
              <Send size={15} /> {sending ? 'Sending...' : 'Send Message'}
            </button>
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Messages Inbox Component ─────────────────────────────────────────────────
function MessagesInbox({ api, setMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('inbox'); // 'inbox' | 'sent'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [activeView]);

  async function fetchMessages() {
    setLoading(true);
    setError('');
    try {
      const endpoint = activeView === 'inbox' ? '/messages/inbox' : '/messages/sent';
      const data = await api(endpoint);
      setMessages(data);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(msg) {
    if (msg.is_read || activeView === 'sent') return;
    try {
      await api(`/messages/${msg.id}/read`, { method: 'PATCH' });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m));
    } catch {
      // silent fail
    }
  }

  function handleSelectMessage(msg) {
    setSelectedMessage(msg);
    markAsRead(msg);
  }

  if (loading) {
    return <p className="helper" style={{ padding: '24px 0' }}>Loading messages...</p>;
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#e11d48', marginBottom: '12px' }}>{error}</p>
        <button className="ghost" onClick={fetchMessages}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', minHeight: '400px' }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid #E5E7EB', paddingRight: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`tab${activeView === 'inbox' ? ' active' : ''}`}
            onClick={() => { setActiveView('inbox'); setSelectedMessage(null); }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Mail size={14} style={{ marginRight: '4px' }} /> Inbox
          </button>
          <button
            className={`tab${activeView === 'sent' ? ' active' : ''}`}
            onClick={() => { setActiveView('sent'); setSelectedMessage(null); }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Send size={14} style={{ marginRight: '4px' }} /> Sent
          </button>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
          {messages.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', padding: '12px' }}>
              No messages {activeView === 'inbox' ? 'received' : 'sent'} yet.
            </p>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px', marginBottom: '6px',
                  backgroundColor: selectedMessage?.id === msg.id ? '#e0f2fe' : msg.is_read || activeView === 'sent' ? '#ffffff' : '#f0f9ff',
                  border: `1px solid ${selectedMessage?.id === msg.id ? '#0ea5e9' : '#E5E7EB'}`,
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#000000', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{activeView === 'inbox' ? msg.sender_name : msg.recipient_name}</span>
                  {!msg.is_read && activeView === 'inbox' && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9', display: 'inline-block' }} />
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: msg.is_read || activeView === 'sent' ? 400 : 600 }}>
                  {msg.subject}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                  {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div style={{ padding: '12px' }}>
        {selectedMessage ? (
          <div>
            <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>{selectedMessage.subject}</h3>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                <span style={{ fontWeight: 600 }}>From:</span> {selectedMessage.sender_name} &lt;{selectedMessage.sender_id}&gt;
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                <span style={{ fontWeight: 600 }}>To:</span> {selectedMessage.recipient_name}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                {new Date(selectedMessage.created_at).toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#4B5563', whiteSpace: 'pre-wrap' }}>
              {selectedMessage.body}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
            <p>Select a message to view</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function MyProfile() {
  const { session, cases, stats, setMessage, api, load, logout } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [studentOwnProfile, setStudentOwnProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'my-info' | 'messages'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [messageRecipient, setMessageRecipient] = useState(null); // { user, complaint }
  const [unreadCount, setUnreadCount] = useState(0);
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('all'); // 'all' | 'open' | 'resolved'
  const [descText, setDescText] = useState(''); // controlled textarea for char counter
  const [titleText, setTitleText] = useState('');
  const [similarProblems, setSimilarProblems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.role !== 'student' || (!titleText && !descText)) {
      setSimilarProblems([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const dept = studentOwnProfile?.department || '';
        const query = new URLSearchParams({ title: titleText, description: descText, department: dept });
        const res = await api(`/problems/similar?${query.toString()}`);
        setSimilarProblems(res || []);
      } catch (e) {
        setSimilarProblems([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [titleText, descText, studentOwnProfile, api, session]);

  async function joinProblem(id) {
    try {
      await api(`/problems/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ title: titleText, description: descText })
      });
      setTitleText('');
      setDescText('');
      setSimilarProblems([]);
      setMessage('Successfully joined the problem');
      await load();
    } catch (e) {
      setMessage(e.message);
    }
  }

  function handleSignOut() {
    logout();
    navigate('/');
  }

  useEffect(() => {
    if (session?.role === 'admin') {
      fetchAdminData();
    } else if (session?.role === 'student') {
      fetchOwnProfile();
    }
    fetchUnreadCount();
  }, [session]);

  async function fetchOwnProfile() {
    try {
      const data = await api('/students/me/profile');
      setStudentOwnProfile(data);
    } catch {
      setStudentOwnProfile(null);
    }
  }

  async function fetchUnreadCount() {
    try {
      const data = await api('/messages/unread-count');
      setUnreadCount(data.unread_count);
    } catch {
      setUnreadCount(0);
    }
  }

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
    if (session?.role === 'student' && (!studentOwnProfile || !studentOwnProfile.prn_number)) {
      setMessage("Please complete your Academic Profile in 'My Info' before submitting a grievance.");
      setActiveTab('my-info');
      return;
    }

    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await api('/complaints', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          title: titleText,
          description: descText,
          force_new: true, // As requested in the plan
        }),
      });
      formEl.reset();
      setTitleText('');
      setDescText('');
      setSimilarProblems([]);
      setMessage('Complaint submitted successfully');
      await load();
    } catch (err) {
      if (err.message?.includes('Academic Profile') || err.message?.includes('My Info')) {
        setActiveTab('my-info');
      }
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

  const filteredCases = (cases || []).filter((item) => {
    const q = caseSearch.trim().toLowerCase();
    const matchesSearch = !q
      || item.title?.toLowerCase().includes(q)
      || item.description?.toLowerCase().includes(q)
      || item.department?.toLowerCase().includes(q);
    const matchesStatus = caseStatusFilter === 'all'
      ? true
      : caseStatusFilter === 'open'
      ? ['open', 'in_progress', 'escalated'].includes(item.status)
      : ['resolved', 'closed'].includes(item.status);
    return matchesSearch && matchesStatus;
  });

  if (!session) return null;

  if (session.role === 'admin') {
    return <AdminDashboard />;
  }

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
          <button
            className={`tab${activeTab === 'messages' ? ' active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <Mail size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Messages
            {unreadCount > 0 && (
              <span style={{ marginLeft: '6px', backgroundColor: '#e11d48', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab Bar for non-students */}
      {session.role !== 'student' && (
        <div className="tab-bar">
          <button
            className={`tab${activeTab === 'grievances' ? ' active' : ''}`}
            onClick={() => setActiveTab('grievances')}
          >
            <Shield size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {session.role === 'admin' ? 'All Cases' : 'Department Queue'}
          </button>
          <button
            className={`tab${activeTab === 'messages' ? ' active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <Mail size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Messages
            {unreadCount > 0 && (
              <span style={{ marginLeft: '6px', backgroundColor: '#e11d48', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {session.role === 'student' && activeTab === 'my-info' && (
        <div style={{ padding: '24px clamp(18px, 4vw, 48px)' }}>
          <StudentInfoTab
            api={api}
            setMessage={setMessage}
            onProfileSaved={(p) => setStudentOwnProfile(p)}
          />
        </div>
      )}

      {/* ── Messages Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div style={{ padding: '24px clamp(18px, 4vw, 48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Mail size={22} color="#000000" />
            <h2 style={{ margin: 0 }}>Messages</h2>
          </div>
          <MessagesInbox api={api} setMessage={setMessage} />
        </div>
      )}

      {/* ── My Grievances Tab (+ non-student views) ─────────────────────── */}
      {(session.role !== 'student' || activeTab === 'grievances') && (
        <section className={`layout ${session.role !== 'student' ? 'single' : ''}`}>
          {session.role === 'student' && (() => {
            const profileReady = studentOwnProfile && studentOwnProfile.prn_number && studentOwnProfile.full_name;
            return (
              <div className="panel form">
                <ClipboardList size={22} />
                <h2>Submit a grievance</h2>
                <div style={{ position: 'relative' }}>
                  {!profileReady && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(2px)',
                      zIndex: 10,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px', padding: '20px', textAlign: 'center',
                      border: '1.5px dashed #fb923c'
                    }}>
                      <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</span>
                      <strong style={{ fontSize: '15px', color: '#1F2937', marginBottom: '6px' }}>Form Locked</strong>
                      <span style={{ fontSize: '13px', color: '#78350f', marginBottom: '16px' }}>
                        You must complete your Academic Profile before you can submit a grievance.
                      </span>
                      <button type="button" onClick={() => setActiveTab('my-info')}
                        style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#000000', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                        Complete My Profile Now
                      </button>
                    </div>
                  )}

                  <form onSubmit={createComplaint} style={!profileReady ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
                    <p className="helper" style={{ marginBottom: '12px' }}>Describe issue clearly. Priority and routing remain subject to authorized review.</p>
                    <input name="title" placeholder="Title" required disabled={!profileReady} value={titleText} onChange={(e) => setTitleText(e.target.value)} />
                    <textarea
                      name="description"
                      placeholder="Describe issue"
                      required
                      minLength={20}
                      maxLength={1000}
                      value={descText}
                      onChange={(e) => setDescText(e.target.value)}
                      rows={5}
                      disabled={!profileReady}
                    />
                    <p className="helper" style={{ marginTop: '-8px', fontSize: '11px' }}>
                      Min. 20 characters required. Provide specific details (e.g., location, dates, people involved).
                    </p>
                    <p style={{ textAlign: 'right', fontSize: '11px', color: '#9CA3AF', margin: '-4px 0 8px' }}>
                      {descText.length} / 1000
                    </p>

                    {similarProblems.length > 0 && (
                      <div style={{ backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' }}>
                          <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                          Existing similar issues
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {similarProblems.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>{p.affected_users} students affected</div>
                              </div>
                              <button type="button" onClick={() => joinProblem(p.id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#000000', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Join this problem
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button disabled={!profileReady} style={{ width: '100%', marginTop: '4px', backgroundColor: !profileReady ? '#9CA3AF' : '#000000', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', cursor: !profileReady ? 'not-allowed' : 'pointer', border: 'none', padding: '12px' }}>
                      {similarProblems.length > 0 ? 'Submit as genuinely new' : 'Create'}
                    </button>
                  </form>
                </div>
              </div>
            );
          })()}

          <section className="panel queue">
            <div className="queue-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={22} />
                  <h2>
                    {session.role === 'student'
                      ? 'My case history'
                      : session.role === 'admin'
                      ? 'All institutional cases'
                      : 'My department queue'}
                  </h2>
                </div>
                <p className="helper">
                  {session.role === 'student'
                    ? 'Only you can see these cases.'
                    : session.role === 'admin'
                    ? 'Central administrators can oversee all cases.'
                    : 'Server-side scope restricts this queue to your department.'}
                </p>
              </div>

              <div className="queue-controls">
                <div className="search-box">
                  <Search size={15} color="#9CA3AF" />
                  <input
                    type="text"
                    placeholder="Search grievances..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                  />
                </div>
                <div className="status-filter">
                  {['all', 'open', 'resolved'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`filter-btn${caseStatusFilter === f ? ' active' : ''}`}
                      onClick={() => setCaseStatusFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cases">
              {filteredCases.length === 0 && (
                <p className="helper" style={{ padding: '12px 0' }}>No grievances match this search/filter.</p>
              )}
              {filteredCases.map((item) => {
                const timelineStates = getTimelineStates(item.status);
                const statusLabel = item.status === 'in_progress' ? 'IN PROGRESS' : item.status.toUpperCase().replace('_', ' ');
                return (
                  <article
                    className="case"
                    key={item.id}
                    style={{ cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                    onClick={() => setSelectedComplaint(item)}
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Title row + status badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#000000', lineHeight: 1.3 }}>{item.title}</strong>
                        <span className={`badge-status ${item.status}`} style={{ flexShrink: 0 }}>{statusLabel}</span>
                      </div>

                      {/* Dept + Priority */}
                      <div style={{ fontSize: '12px', color: '#4B5563' }}>
                        Dept: <strong>{item.department}</strong>&nbsp;&nbsp; Priority: <strong>{item.priority}</strong>
                      </div>

                      {/* Student identity pill (non-student views only) */}
                      {session.role !== 'student' && (
                        <span style={{ alignSelf: 'flex-start', color: '#0369a1', fontWeight: 600, background: '#e0f2fe', padding: '3px 10px', borderRadius: '20px', border: '1px solid #bae6fd', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          👤 {item.student_prn || 'N/A'} · Div: {item.student_division || '—'} · Roll: {item.student_roll_no || '—'}
                        </span>
                      )}

                      {/* Timeline steps */}
                      <div className="case-timeline">
                        {CASE_STEPS.map((label, i) => {
                          const state = timelineStates[i];
                          const isLast = i === CASE_STEPS.length - 1;
                          const isFilled = state === 'done' || state === 'resolved-done';
                          return (
                            <div className={`timeline-step ${state}`} key={label}>
                              <div className="step-marker">
                                <span className="step-dot">
                                  {isFilled ? <Check size={12} strokeWidth={3} /> : null}
                                </span>
                                {!isLast && <span className="step-line" />}
                              </div>
                              <span className="step-label">{label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Description snippet */}
                      <p className="case-description">
                        {item.description
                          ? (item.description.length > 90 ? item.description.substring(0, 90) + '...' : item.description)
                          : 'No description'}
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
                );
              })}
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
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px' }}>
                    Priority: {selectedComplaint.priority}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF' }}>
                    ID: {selectedComplaint.id.substring(0, 8)}...
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#000000' }}>
                  {selectedComplaint.title}
                </h2>
              </div>
              <button
                className="ghost"
                onClick={() => setSelectedComplaint(null)}
                style={{ minHeight: 'auto', padding: '6px', borderRadius: '50%', color: '#6B7280' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Describe Issue Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#000000', fontWeight: 700, fontSize: '14px' }}>
                  <FileText size={18} />
                  <span>Described Issue / Full Complaint Details</span>
                </div>
                <div className="issue-box">
                  {selectedComplaint.description || 'No description provided.'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', fontSize: '12px', color: '#6B7280' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', color: '#0d9488', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={18} />
                    <span>Submitter Profile &amp; Academic Identity</span>
                  </div>
                  {session.role !== 'student' && selectedComplaint.student_id && (
                    <button
                      className="ghost"
                      onClick={() => setMessageRecipient({
                        user: {
                          id: selectedComplaint.student_id,
                          full_name: selectedComplaint.student_name,
                          email: selectedComplaint.student_email,
                        },
                        complaint: selectedComplaint,
                      })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px' }}
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                  )}
                </div>
                <div className="info-grid">
                  <span className="info-label">Full Name:</span>
                  <span style={{ fontWeight: 700, color: '#000000' }}>
                    {selectedComplaint.student_name || 'Registered Student'}
                  </span>

                  <span className="info-label">PRN Number:</span>
                  <span>
                    <span className="badge-prn">
                      {selectedComplaint.student_prn || 'N/A'}
                    </span>
                  </span>

                  <span className="info-label">Division:</span>
                  <span style={{ fontWeight: 600, color: '#4B5563' }}>
                    {selectedComplaint.student_division || 'N/A'}
                  </span>

                  <span className="info-label">Roll No:</span>
                  <span style={{ fontWeight: 600, color: '#4B5563' }}>
                    {selectedComplaint.student_roll_no || 'N/A'}
                  </span>

                  <span className="info-label">Department:</span>
                  <span style={{ fontWeight: 600, color: '#4B5563' }}>
                    {selectedComplaint.student_department || selectedComplaint.department}
                  </span>

                  <span className="info-label">Year / Semester:</span>
                  <span style={{ fontWeight: 600, color: '#4B5563' }}>
                    {selectedComplaint.student_year_semester || 'N/A'}
                  </span>

                  <span className="info-label">Contact No:</span>
                  <span style={{ fontWeight: 600, color: '#4B5563' }}>
                    {selectedComplaint.student_contact || 'N/A'}
                  </span>

                  <span className="info-label">Email Address:</span>
                  <span style={{ fontWeight: 600, color: '#4B5563' }}>
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

      {/* ── Message Modal ─────────────────────────────────────────────────── */}
      {messageRecipient && (
        <MessageModal
          recipient={messageRecipient.user}
          complaint={messageRecipient.complaint}
          api={api}
          setMessage={setMessage}
          onClose={() => setMessageRecipient(null)}
        />
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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #E5E7EB' }}>
            <Activity size={24} color="#0D9488" style={{ marginBottom: '8px', display: 'block' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>
              System Audit &amp; Sign-in Activity Logs
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 20px 0' }}>
              Tracks user sign-ins, registrations, and administrative events.
            </p>
            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {auditLogs.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => {
                  const actorEmail = log.event_metadata?.email
                    || (log.event_metadata?.username ? log.event_metadata.username : `User #${log.actor_id || log.entity_id}`);
                  const formattedTime = new Date(log.created_at).toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  });
                  return (
                    <div key={log.id} style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#000000' }}>{log.action} — {actorEmail}</span>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>Entity: {log.entity_type} · Time: {formattedTime}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Card: Registered Users with expandable student profiles */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #E5E7EB' }}>
            <Users size={24} color="#0D9488" style={{ marginBottom: '8px', display: 'block' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>
              Registered Users
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 6px 0' }}>
              Click a row to view academic profile details.
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 20px 0' }}>
              {studentProfiles.length} of {usersList.length} user{usersList.length !== 1 ? 's' : ''} have submitted academic profiles.
            </p>
            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {usersList.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>No registered users found.</p>
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
