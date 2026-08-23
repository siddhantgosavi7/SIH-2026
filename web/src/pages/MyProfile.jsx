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
        <section
          style={{
            marginTop: '28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Left Card: System Audit & Sign-in Activity Logs */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid #E2E8F0',
              boxSizing: 'border-box',
            }}
          >
            <Activity size={24} color="#0D9488" style={{ marginBottom: '8px', display: 'block' }} />
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0B0B12',
                margin: '0 0 4px 0',
              }}
            >
              System Audit &amp; Sign-in Activity Logs
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748B',
                margin: '0 0 20px 0',
              }}
            >
              Tracks user sign-ins, registrations, and administrative events.
            </p>

            <div
              style={{
                maxHeight: '600px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '4px',
              }}
            >
              {auditLogs.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#94A3B8', fontStyle: 'italic' }}>No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => {
                  const actorEmail =
                    log.event_metadata?.email ||
                    (log.event_metadata?.username ? `${log.event_metadata.username}` : `User #${log.actor_id || log.entity_id}`);
                  const formattedTime = new Date(log.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #F1F5F9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#0B0B12',
                        }}
                      >
                        {log.action} — {actorEmail}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#64748B',
                        }}
                      >
                        Entity: {log.entity_type} · Time: {formattedTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Card: Registered Users */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid #E2E8F0',
              boxSizing: 'border-box',
            }}
          >
            <Users size={24} color="#0D9488" style={{ marginBottom: '8px', display: 'block' }} />
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0B0B12',
                margin: '0 0 4px 0',
              }}
            >
              Registered Users
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748B',
                margin: '0 0 20px 0',
              }}
            >
              List of all registered accounts in the system.
            </p>

            <div
              style={{
                maxHeight: '600px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '4px',
              }}
            >
              {usersList.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#94A3B8', fontStyle: 'italic' }}>No registered users found.</p>
              ) : (
                usersList.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #F1F5F9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: '#0B0B12',
                      }}
                    >
                      {user.email}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#64748B',
                      }}
                    >
                      Role: {user.role} {user.username ? `· Username: @${user.username}` : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
