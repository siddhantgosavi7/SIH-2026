import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function StudentNewComplaint() {
  const { api, setMessage } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || !cleanDescription) return setMessage('Title and description are required.');

    setBusy(true);
    try {
      const result = await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({ title: cleanTitle, description: cleanDescription }),
      });
      setMessage('Complaint submitted successfully.');
      const id = result?.id || result?.complaint_id;
      navigate(id ? `/student/complaints/${encodeURIComponent(id)}` : '/student/complaints');
    } catch (error) {
      setMessage(error.message || 'Could not submit complaint.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-page">
    <section className="student-hero">
      <div>
        <Link className="student-link" to="/student"><ArrowLeft size={12} /> Back</Link>
        <div className="admin-kicker" style={{ marginTop: 14 }}>NEW GRIEVANCE</div>
        <h1>Tell us what happened.</h1>
        <p>Do not select a department or priority. The backend handles classification, grouping and routing.</p>
      </div>
    </section>

    <form className="student-panel" onSubmit={submit} style={{ maxWidth: 900 }}>
      <div className="student-form-grid">
        <div className="student-field full">
          <label htmlFor="complaint-title">Problem title</label>
          <input id="complaint-title" required minLength={3} maxLength={240} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water supply unavailable in Hostel B" />
        </div>
        <div className="student-field full">
          <label htmlFor="complaint-description">Description</label>
          <textarea id="complaint-description" required minLength={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what is happening, where it occurs and useful context." />
        </div>
      </div>
      <div className="student-note"><Sparkles size={16} /><div><strong>Automatic analysis.</strong> GIOP determines category, department, priority and problem grouping after submission.</div></div>
      <div className="student-actions">
        <button type="button" className="admin-button secondary" onClick={() => navigate('/student')}>Cancel</button>
        <button className="admin-button primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit complaint'}</button>
      </div>
    </form>
  </div>;
}
