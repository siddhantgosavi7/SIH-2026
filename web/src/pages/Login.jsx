import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { token, setToken, setSession, message, setMessage, api } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registering, setRegistering] = useState(false);
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

    try {
      // TEMP: hardcoded admin credential for demo — replace with real role-based auth before production
      if (email === 'admin@gmail.com' && password === 'admin@123') {
        const adminData = { access_token: 'demo-admin-token', role: 'admin', department: null };
        localStorage.setItem('token', adminData.access_token);
        localStorage.setItem('session', JSON.stringify(adminData));
        setToken(adminData.access_token);
        setSession(adminData);
        setMessage('Signed in as Admin');
        navigate('/');
        return;
      }

      // TODO: wire to real login API marker
      const data = await api(registering ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {},
      });

      if (registering) {
        setRegistering(false);
        setMessage('Account created. Sign in.');
        setErrorMessage('');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('session', JSON.stringify(data));
      setToken(data.access_token);
      setSession(data);
      setMessage('Signed in');
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password');
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
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Icon */}
        <LogIn size={28} color="#0B0B12" style={{ marginBottom: '16px' }} />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#0F6E82',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          GRIEVANCE INTELLIGENCE &amp; ORCHESTRATION
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#0B0B12',
            margin: '0 0 24px 0',
            letterSpacing: '-0.02em',
          }}
        >
          {registering ? 'Create student account' : 'Sign in'}
        </h1>

        {/* Form */}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#0B0B12',
                backgroundColor: '#FBFDFF',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#0B0B12',
                backgroundColor: '#FBFDFF',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {/* Error message */}
            {(errorMessage || message) && (
              <p
                style={{
                  color: errorMessage ? '#ef4444' : '#0F6E82',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '6px',
                  paddingLeft: '4px',
                  margin: '6px 0 0 0',
                }}
              >
                {errorMessage || message}
              </p>
            )}
          </div>

          {/* Primary Sign in button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              backgroundColor: '#0F6E82',
              color: '#ffffff',
              fontWeight: 700,
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              border: 0,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {isSubmitting ? 'Signing in...' : registering ? 'Create student account' : 'Sign in'}
          </button>

          {/* Secondary Button */}
          <button
            type="button"
            onClick={() => {
              setRegistering(!registering);
              setErrorMessage('');
              setMessage('');
            }}
            style={{
              width: '100%',
              backgroundColor: '#EAEFEF',
              color: '#0F6E82',
              fontWeight: 600,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              border: 0,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {registering ? 'Already have an account? Sign in' : 'New student? Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
