import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Shield, BookOpen, Mail, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UserLayout() {
  const { session } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'My Complaints', path: '/user/dashboard', icon: Shield },
    { name: 'My Profile', path: '/user/profile', icon: BookOpen },
    { name: 'Messages', path: '/user/messages', icon: Mail },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '40px', padding: '0 8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#3D4FFF',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '14px',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            G
          </div>
          <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em', color: '#0B0B12' }}>GIOP</span>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive ? '#3D4FFF' : '#64748B',
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 8px', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#E2E8F0',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {session?.username ? session.username.substring(0, 2).toUpperCase() : 'ST'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {session?.username || 'Student User'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Student
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar with bell icon */}
        <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px', backgroundColor: '#F8FAFC' }}>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <Bell size={20} />
          </button>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
