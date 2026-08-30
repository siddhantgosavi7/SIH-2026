import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Compass, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Signup() {
  const { setToken, setSession, setMessage, api } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const data = await api('/departments');
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    }
    fetchDepartments();
  }, [api]);

  async function handleSignup(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username, department }),
        headers: {},
      });

      setMessage('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Email may already be registered.');
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
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Compass size={24} />
        </div>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#000000',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Create your account
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: '0 0 28px 0',
            fontWeight: 500,
          }}
        >
          Join GIOP and start managing grievances
        </p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="#9CA3AF"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                className="input-with-icon"
                placeholder="e.g. johndoe"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>
              Department
            </label>
            <div style={{ position: 'relative' }}>
              <Building
                size={18}
                color="#9CA3AF"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}
              />
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  appearance: 'none',
                }}
              >
                <option value="">Select your department</option>
                {departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#9CA3AF"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="email"
                className="input-with-icon"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4B5563', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#9CA3AF"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="password"
                className="input-with-icon"
                placeholder="Min. 8 characters"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {errorMessage && (
              <p style={{ color: '#4B5563', fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>
                {errorMessage}
              </p>
            )}
          </div>

          {/* Primary Create Account Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: 'var(--brand-gradient)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              border: 0,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          <span style={{ padding: '0 12px', fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
        </div>

        {/* Bottom Link */}
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, fontWeight: 500 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#000000', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
