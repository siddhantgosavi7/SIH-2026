import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="app">
      <header>
        <div>
          <p className="eyebrow">Grievance Intelligence &amp; Orchestration</p>
          <h1>GIOP Platform</h1>
          <p>Automated intelligence and workflow orchestration for institutional grievance resolution.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {token ? (
            <>
              <Link to="/myProfile" title="My Profile" style={{ display: 'flex', alignItems: 'center', color: '#176b87' }}>
                <User size={28} />
              </Link>
              <button className="ghost" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </header>

      <section className="layout" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
        <section className="panel" style={{ textAlign: 'center', padding: '48px 24px', display: 'grid', gap: '16px', justifyItems: 'center' }}>
          <ShieldCheck size={48} color="#176b87" />
          <h2 style={{ fontSize: '24px' }}>Welcome to Grievance Intelligence &amp; Orchestration</h2>
          <p className="helper" style={{ maxWidth: '600px' }}>
            A centralized institutional platform designed to efficiently register, track, analyze, and resolve grievances with intelligent routing and role-based workspace management.
          </p>
          {!token && (
            <button style={{ marginTop: '8px' }} onClick={() => navigate('/login')}>
              Sign in to Workspace
            </button>
          )}
          {token && (
            <button style={{ marginTop: '8px' }} onClick={() => navigate('/myProfile')}>
              Go to My Workspace
            </button>
          )}
        </section>
      </section>
    </main>
  );
}
