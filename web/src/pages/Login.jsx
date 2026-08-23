import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { token, setToken, setSession, message, setMessage, api } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [loginMode, setLoginMode] = useState('student');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  async function login(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      const data = await api(registering ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
        headers: {},
      });
      if (registering) {
        formEl.reset();
        setRegistering(false);
        setMessage('Account created. Sign in.');
        return;
      }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('session', JSON.stringify(data));
      setToken(data.access_token);
      setSession(data);
      setMessage('Signed in');
      navigate('/');
    } catch (err) {
      setMessage(err.message);
    }
  }

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
        {loginMode === 'student' && (
          <button className="ghost" type="button" onClick={() => { setRegistering(!registering); setMessage(''); }}>
            {registering ? 'I already have an account' : 'New student? Create account'}
          </button>
        )}
      </section>
    </main>
  );
}
