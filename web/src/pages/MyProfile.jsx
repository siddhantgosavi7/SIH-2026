import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Shield, Trash2, Upload, UserPlus, Users, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MyProfile() {
  const { session, cases, stats, setMessage, api, load, logout } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
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
      // Fallback demo users list
      setUsersList([
        { id: 1, email: 'admin@gmail.com', role: 'admin', department: 'Central' },
        { id: 2, email: 'student1@gmail.com', role: 'student', department: null },
        { id: 3, email: 'adi@gmail.com', role: 'student', department: null },
      ]);
    }

    try {
      const logs = await api('/admin/audit-logs');
      setAuditLogs(logs);
    } catch {
      // Fallback demo audit logs
      setAuditLogs([
        { id: 1, action: 'user.login', entity_type: 'user', entity_id: '1', event_metadata: { email: session?.email || 'admin@gmail.com', role: session?.role || 'admin' }, created_at: new Date().toISOString() },
        { id: 2, action: 'student.registered', entity_type: 'user', entity_id: '3', event_metadata: { email: 'adi@gmail.com' }, created_at: new Date(Date.now() - 3600000).toISOString() },
      ]);
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
          <p>
            {session.username ? `Hi, ${session.username}` : 'Hi, User'}
          </p>
        </div>
        <button className="ghost" onClick={handleSignOut}>
          Sign out
        </button>
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

      <section className="layout">
        {session.role === 'student' && (
          <form className="panel form" onSubmit={createComplaint}>
            <ClipboardList size={22} />
            <h2>Submit a grievance</h2>
            <p className="helper">Describe issue clearly. Priority and routing remain subject to authorized review.</p>
            <input name="department" placeholder="Department" required />
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
              <article className="case" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.department} · {item.priority} · {item.status}</span>
                </div>
                <div className="actions">
                  {session.role !== 'student' && item.status !== 'closed' && (
                    <>
                      <button title="Start work" onClick={() => transition(item.id, 'in_progress')}><UserPlus size={16} /></button>
                      <button title="Resolve" onClick={() => transition(item.id, 'resolved')}><Upload size={16} /></button>
                    </>
                  )}
                  {(session.role === 'student' || item.status === 'resolved' || item.status === 'closed') && (
                    <button className="btn-delete" title="Delete complaint" onClick={() => deleteComplaint(item.id)}><Trash2 size={16} /></button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {/* Admin Audit & Login Activity Logs Panel */}
      {session.role === 'admin' && (
        <section className="layout" style={{ marginTop: '20px' }}>
          <section className="panel">
            <Activity size={22} />
            <h2>System Audit &amp; Sign-in Activity Logs</h2>
            <p className="helper">Tracks user sign-ins, registrations, and administrative events.</p>
            <div className="cases" style={{ marginTop: '12px' }}>
              {auditLogs.map((log) => (
                <article className="case" key={log.id}>
                  <div>
                    <strong>{log.action} — {log.event_metadata?.email || `User #${log.actor_id || log.entity_id}`}</strong>
                    <span>Entity: {log.entity_type} · Time: {new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <Users size={22} />
            <h2>Registered Users</h2>
            <p className="helper">List of all registered accounts in the system.</p>
            <div className="cases" style={{ marginTop: '12px' }}>
              {usersList.map((user) => (
                <article className="case" key={user.id}>
                  <div>
                    <strong>{user.email}</strong>
                    <span>Role: {user.role} {user.department ? `· ${user.department}` : ''}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
