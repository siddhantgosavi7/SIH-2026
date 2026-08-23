import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClipboardList, LogIn, Shield, Upload, UserPlus } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [session, setSession] = useState(JSON.parse(localStorage.getItem('session') || 'null'));
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [registering, setRegistering] = useState(false);
  const [loginMode, setLoginMode] = useState('student');
  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? auth : {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
  }

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await api(registering ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
        headers: {},
      });
      if (registering) {
        event.currentTarget.reset();
        setRegistering(false);
        setMessage('Account created. Sign in.');
        return;
      }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('session', JSON.stringify(data));
      setToken(data.access_token);
      setSession(data);
      setMessage('Signed in');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createComplaint(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
    event.currentTarget.reset();
    setMessage('Complaint created');
    load();
  }

  async function transition(id, status) {
    await api(`/complaints/${id}/transition`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  }

  async function load() {
    if (!token) return;
    const list = await api('/complaints');
    setCases(list);
    if (session?.role !== 'student') {
      setStats(await api('/dashboard/department'));
    }
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, [token]);

  if (!token) {
    const selectLoginMode = (mode) => {
      setLoginMode(mode);
      setRegistering(false);
      setMessage('');
    };
    return (
      <main className="auth">
        <section className="panel login">
          <LogIn size={28} />
          <p className="eyebrow">Grievance Intelligence &amp; Orchestration</p>
          <h1>{registering ? 'Create Student Account' : loginMode === 'student' ? 'Student sign in' : 'Admin & staff sign in'}</h1>
          <div className="login-modes">
            <button className={loginMode === 'student' ? 'mode active' : 'mode'} type="button" onClick={() => selectLoginMode('student')}>Student</button>
            <button className={loginMode === 'admin' ? 'mode active' : 'mode'} type="button" onClick={() => selectLoginMode('admin')}>Admin / staff</button>
          </div>
          <p className="helper">{registering ? 'Student accounts can only access their own cases.' : loginMode === 'student' ? 'Students see only their own grievance history.' : 'Administrators see all cases. Staff see only their department queue.'}</p>
          <form onSubmit={login}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" minLength="8" required />
            <button>{registering ? 'Create student account' : 'Sign in'}</button>
          </form>
          {loginMode === 'student' && <button className="ghost" type="button" onClick={() => { setRegistering(!registering); setMessage(''); }}>
            {registering ? 'I already have an account' : 'New student? Create account'}
          </button>}
          <p>{message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header>
        <div>
          <p className="eyebrow">Grievance Intelligence &amp; Orchestration</p>
          <h1>{session.role === 'student' ? 'My grievance workspace' : session.role === 'admin' ? 'Central grievance control' : 'Department grievance queue'}</h1>
          <p>{session.role}{session.department ? ` · ${session.department}` : ''}</p>
        </div>
        <button className="ghost" onClick={() => { localStorage.clear(); setToken(''); }}>
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
          <h2>{session.role === 'student' ? 'My case history' : session.role === 'admin' ? 'All institutional cases' : 'My department queue'}</h2>
          <p className="helper">{session.role === 'student' ? 'Only you can see these cases.' : session.role === 'admin' ? 'Central administrators can oversee all cases.' : 'Server-side scope restricts this queue to your department.'}</p>
          <div className="cases">
            {cases.map((item) => (
              <article className="case" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.department} · {item.priority} · {item.status}</span>
                </div>
                {session.role !== 'student' && item.status !== 'closed' && (
                  <div className="actions">
                    <button title="Start work" onClick={() => transition(item.id, 'in_progress')}><UserPlus size={16} /></button>
                    <button title="Resolve" onClick={() => transition(item.id, 'resolved')}><Upload size={16} /></button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </section>
      <p className="toast">{message}</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
