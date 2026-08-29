import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function DepartmentLayout() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'solve complain', path: '/department' },
    { name: 'admin suggestions', path: '/department/suggestions' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFFFF', color: '#000000', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          borderRight: '2px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 0'
        }}
      >
        {/* Header Logo */}
        <div style={{ padding: '0 32px', marginBottom: '48px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#000000' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>
              SAASLY
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/department' && location.pathname.startsWith(item.path));
            const isStrictActive = item.path === '/department' ? location.pathname === '/department' || location.pathname.match(/^\/department\/complaints/) : isActive;

            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 32px',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: isStrictActive ? 700 : 500,
                  color: isStrictActive ? '#000000' : '#4B5563',
                  backgroundColor: 'transparent',
                }}
              >
                {item.name}
                {/* Circle Indicator */}
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: isStrictActive ? '#000000' : 'transparent',
                  border: isStrictActive ? 'none' : '2px solid #9CA3AF'
                }} />
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div style={{ padding: '0 32px', marginTop: 'auto' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              border: 0,
              backgroundColor: 'transparent',
              color: '#9CA3AF',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
        <Outlet />
      </main>
    </div>
  );
}
