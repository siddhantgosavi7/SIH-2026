import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { token, setToken, setSession, message, setMessage, api } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  async function login(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const cleanUsername = username.trim();

    if (cleanUsername.includes('@')) {
      setErrorMessage('Please enter your username, not an email address to log in.');
      setIsSubmitting(false);
      return;
    }

    try {
      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUsername, password }),
          headers: {},
        });

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('session', JSON.stringify(data));
        setToken(data.access_token);
        setSession(data);
        setMessage(data.role === 'admin' ? 'Signed in as Admin' : 'Signed in');
        navigate('/');
        return;
      } catch (backendErr) {
        if (backendErr.message === 'Failed to fetch' || backendErr.message?.includes('fetch')) {
          // Only fallback if backend API server is completely offline
          const isAdmin = cleanUsername === 'admin' && password === 'admin@123';
          const sessionData = {
            access_token: 'demo-offline-token',
            role: isAdmin ? 'admin' : 'student',
            username: cleanUsername
          };
          localStorage.setItem('token', sessionData.access_token);
          localStorage.setItem('session', JSON.stringify(sessionData));
          setToken(sessionData.access_token);
          setSession(sessionData);
          setMessage(isAdmin ? 'Signed in as Admin (Offline)' : 'Signed in (Offline)');
          navigate('/');
          return;
        }
        throw backendErr;
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #DCEEF7 0%, #E4F5EE 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Circle Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#3D4FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(61, 79, 255, 0.25)',
          }}
        >
          <Compass size={24} />
        </div>

        {/* Heading & Subtitle */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0B0B12',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 28px 0',
            fontWeight: 500,
          }}
        >
          Log in to your GIOP account
        </p>

        {/* Form */}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          {/* Username / Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="password"
                placeholder="Your password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {(errorMessage || message) && (
              <p
                style={{
                  color: errorMessage ? '#ef4444' : '#0F6E82',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '6px',
                }}
              >
                {errorMessage || message}
              </p>
            )}
          </div>

          {/* Primary Log In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              backgroundColor: '#3D4FFF',
              color: '#ffffff',
              fontWeight: 700,
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              border: 0,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: '8px',
              boxShadow: '0 4px 14px rgba(61, 79, 255, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ padding: '0 12px', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Bottom Link */}
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: '#3D4FFF', fontWeight: 700, textDecoration: 'none' }}>
            Sign up for free
          </Link>
        </p>
      </div>
    </main>
  );
}
