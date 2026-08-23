import React from 'react';
import { ClipboardList, Shield, Trash2, Upload, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MyProfile() {
  const { session, cases, stats, setMessage, api, load, logout } = useAuth();

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
          <p>{session.role}{session.department ? ` · ${session.department}` : ''}</p>
        </div>
        <button className="ghost" onClick={logout}>
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
    </main>
  );
}
