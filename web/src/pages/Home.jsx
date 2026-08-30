import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Send,
  Building2,
  GraduationCap,
  Landmark,
  Briefcase,
  Library,
  HeartPulse,
  Wifi,
  Trophy,
  ShieldCheck,
  Building,
  ArrowRight,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const demoResultsMap = {
  Hostel: {
    priority: 'Priority: High',
    prioritySub: '3 related reports · affects 40+ students',
    routedTo: 'Routed to: Hostel Administration',
    routedSub: 'Auto-assigned, SLA 24h',
    related: 'Related complaint found',
    relatedSub: 'Block A water outage, reported 6h ago',
  },
  'Exam Cell': {
    priority: 'Priority: Critical',
    prioritySub: '24 related reports · affects 120+ students',
    routedTo: 'Routed to: Controller of Examinations',
    routedSub: 'High priority queue, SLA 4h',
    related: 'Related complaint found',
    relatedSub: 'Hall ticket portal download timeout, reported 1h ago',
  },
  Academics: {
    priority: 'Priority: Normal',
    prioritySub: '1 related report · affects 15 students',
    routedTo: 'Routed to: Academic Affairs Committee',
    routedSub: 'Standard review queue, SLA 48h',
    related: 'Related complaint found',
    relatedSub: 'Elective course registration overlap, reported 12h ago',
  },
  Admin: {
    priority: 'Priority: High',
    prioritySub: '5 related reports · affects 50+ students',
    routedTo: 'Routed to: Central Registrar Office',
    routedSub: 'Auto-routed, SLA 12h',
    related: 'Related complaint found',
    relatedSub: 'Annual fee receipt verification pending, reported 24h ago',
  },
  'IT Services': {
    priority: 'Priority: Urgent',
    prioritySub: '18 related reports · affects 300+ students',
    routedTo: 'Routed to: Network Infrastructure Team',
    routedSub: 'Immediate escalation, SLA 2h',
    related: 'Related complaint found',
    relatedSub: 'East Campus Wi-Fi gateway down, reported 30m ago',
  },
  Library: {
    priority: 'Priority: Normal',
    prioritySub: '2 related reports · affects 8 students',
    routedTo: 'Routed to: Library Digital Access Desk',
    routedSub: 'Standard queue, SLA 36h',
    related: 'Related complaint found',
    relatedSub: 'E-journal proxy portal authentication glitch, reported 4h ago',
  },
};

const benchmarkDataMap = {
  Accuracy: [
    { label: 'Routing accuracy', giop: 95, helpdesk: 44, manual: 22, suffix: '%' },
    { label: 'Duplicate catch', giop: 88, helpdesk: 30, manual: 8, suffix: '%' },
    { label: 'SLA compliance', giop: 90, helpdesk: 52, manual: 19, suffix: '%' },
  ],
  Latency: [
    { label: 'Triage speed', giop: 98, helpdesk: 40, manual: 15, suffix: '%' },
    { label: 'First response', giop: 92, helpdesk: 35, manual: 12, suffix: '%' },
    { label: 'Resolution speed', giop: 85, helpdesk: 45, manual: 20, suffix: '%' },
  ],
  Coverage: [
    { label: 'Dept coverage', giop: 100, helpdesk: 60, manual: 35, suffix: '%' },
    { label: 'Intake channels', giop: 94, helpdesk: 50, manual: 25, suffix: '%' },
    { label: 'Audit compliance', giop: 99, helpdesk: 65, manual: 40, suffix: '%' },
  ],
};

export function Home() {
  const { token, session, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('Hostel');
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState('Accuracy');

  const currentDemo = demoResultsMap[selectedCategory];
  const currentChartGroups = benchmarkDataMap[activeBenchmarkTab];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', color: '#0B0B12', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. STICKY NAVBAR */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Logo mark + Wordmark */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                backgroundColor: '#3D4FFF',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '13px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              G
            </div>
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em', color: '#0B0B12' }}>GIOP</span>
          </Link>

          {/* Center: Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            {['Product', 'Departments', 'Enterprise', 'Blog', 'Docs', 'Pricing'].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3D4FFF',
                  textDecoration: 'underline',
                }}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {token ? (
              <>
                <Link
                  to={session?.role === 'admin' ? '/admin' : '/student'}
                  title={session?.role === 'admin' ? 'Admin Console' : 'Student Portal'}
                  style={{ display: 'flex', alignItems: 'center', color: '#3D4FFF' }}
                >
                  <User size={24} />
                </Link>
                <button className="ghost" onClick={logout} style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: '#F1F0EC',
                    color: '#0B0B12',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '8px 16px',
                    minHeight: 'auto',
                  }}
                >
                  Contact admin
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: '#3D4FFF',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '8px 16px',
                    minHeight: 'auto',
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  style={{
                    backgroundColor: '#0B0B12',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '8px 16px',
                    minHeight: 'auto',
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          maxWidth: '1150px',
          margin: '0 auto',
          padding: '64px 24px 64px',
          textAlign: 'center',
        }}
      >
        {/* Floating Shapes & Data Cards */}
        <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              left: '-48px',
              top: '40px',
              width: '80px',
              height: '80px',
              backgroundColor: '#3D4FFF',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(61,79,255,0.2)',
            }}
          />
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              left: '-64px',
              top: '150px',
              width: '64px',
              height: '64px',
              backgroundColor: '#0B0B12',
              borderRadius: '16px',
              animationDelay: '1.8s',
            }}
          />
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              left: '-32px',
              top: '260px',
              width: '80px',
              height: '110px',
              background: 'linear-gradient(180deg, #3D4FFF 0%, #8B98FF 100%)',
              borderRadius: '20px',
              animationDelay: '3.5s',
            }}
          />
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              left: '-64px',
              top: '400px',
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #E2935A 0%, #B97A5C 100%)',
              borderRadius: '16px',
              animationDelay: '2.2s',
            }}
          />

          {/* Floating Data Card 1 */}
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              left: '40px',
              top: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
              width: '128px',
              textAlign: 'left',
              animationDelay: '1s',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.08em' }}>PRIORITY</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0B0B12', marginTop: '2px' }}>High</div>
          </div>

          {/* Floating Data Card 2 */}
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              right: '48px',
              top: '112px',
              backgroundColor: '#0B0B12',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
              width: '160px',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '11px',
              lineHeight: 1.6,
              animationDelay: '2.5s',
            }}
          >
            <div><span style={{ color: '#8B8B9A' }}>route: </span><span style={{ color: '#fcd34d' }}>&quot;hostel&quot;</span></div>
            <div><span style={{ color: '#8B8B9A' }}>sla: </span><span style={{ color: '#1E8A54', fontWeight: 700 }}>24h</span></div>
            <div><span style={{ color: '#8B8B9A' }}>status: </span><span style={{ color: '#1E8A54', fontWeight: 700 }}>open</span></div>
          </div>

          <div
            className="animate-float"
            style={{
              position: 'absolute',
              right: '-48px',
              top: '32px',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(180deg, #8B98FF 0%, #3D4FFF 100%)',
              borderRadius: '20px',
              animationDelay: '0.8s',
            }}
          />
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              right: '-40px',
              top: '230px',
              width: '64px',
              height: '96px',
              backgroundColor: '#3D4FFF',
              borderRadius: '20px',
              animationDelay: '4s',
            }}
          />
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              right: '-64px',
              top: '350px',
              width: '64px',
              height: '64px',
              backgroundColor: '#0B0B12',
              borderRadius: '16px',
              animationDelay: '1.2s',
            }}
          />
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              right: '-48px',
              top: '460px',
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #E2935A 0%, #B97A5C 100%)',
              borderRadius: '16px',
              animationDelay: '3s',
            }}
          />
        </div>

        {/* Hero Content */}
        <h1
          style={{
            fontSize: 'clamp(42px, 5.5vw, 68px)',
            fontWeight: 800,
            color: '#0B0B12',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          The campus grievance system that understands itself.
        </h1>
        <p
          style={{
            marginTop: '24px',
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#8B8B9A',
            maxWidth: '640px',
            margin: '24px auto 0',
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          Classify, prioritize, and route every complaint across every department.
        </p>

        <div style={{ marginTop: '32px' }}>
          <button
            type="button"
            onClick={() => navigate(token ? (session?.role === 'admin' ? '/admin' : '/student') : '/login')}
            style={{
              backgroundColor: '#0B0B12',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '100px',
              padding: '14px 28px',
              border: 0,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            }}
          >
            {token ? 'Go to My Workspace' : 'Try the dashboard'}
          </button>
        </div>
      </section>

      {/* 3. INTERACTIVE DEMO CARD */}
      <section style={{ maxWidth: '920px', margin: '0 auto 96px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
            padding: '32px',
            textAlign: 'left',
          }}
        >
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Hostel water supply — Block A</span>
            <span
              style={{
                backgroundColor: '#EAF7F0',
                color: '#1E8A54',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '100px',
                border: '1px solid rgba(30,138,84,0.2)',
              }}
            >
              confidence 96%
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '100px',
                border: '1px solid rgba(0,0,0,0.15)',
                backgroundColor: '#ffffff',
                color: '#0B0B12',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 'auto',
              }}
            >
              <Search size={14} /> Classify
            </button>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '100px',
                border: '1px solid rgba(0,0,0,0.15)',
                backgroundColor: '#ffffff',
                color: '#0B0B12',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 'auto',
              }}
            >
              <Send size={14} /> Route
            </button>
          </div>

          {/* Two-Column Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: '24px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* Left Column: CATEGORY */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.08em', marginBottom: '12px' }}>
                CATEGORY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['Hostel', 'Exam Cell', 'Academics', 'Admin', 'IT Services', 'Library'].map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? '#0B0B12' : 'transparent',
                        color: isSelected ? '#ffffff' : '#64748b',
                        border: 0,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: 'auto',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: RESULT */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.08em', marginBottom: '12px' }}>
                RESULT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0B0B12' }}>{currentDemo.priority}</div>
                  <div style={{ fontSize: '12px', color: '#8B8B9A', marginTop: '3px' }}>{currentDemo.prioritySub}</div>
                </div>

                <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0B0B12' }}>{currentDemo.routedTo}</div>
                  <div style={{ fontSize: '12px', color: '#8B8B9A', marginTop: '3px' }}>{currentDemo.routedSub}</div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0B0B12' }}>{currentDemo.related}</div>
                  <div style={{ fontSize: '12px', color: '#8B8B9A', marginTop: '3px' }}>{currentDemo.relatedSub}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DEPARTMENTS SECTION */}
      <section style={{ maxWidth: '1150px', margin: '0 auto 96px', padding: '0 24px', textAlign: 'left' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, color: '#0B0B12', letterSpacing: '-0.03em' }}>
          Built to run across every department on campus.
        </h2>
        <div style={{ marginTop: '12px' }}>
          <a
            href="#"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#F1F0EC',
              color: '#0B0B12',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '100px',
              textDecoration: 'none',
            }}
          >
            See how routing works <ArrowRight size={14} />
          </a>
        </div>

        {/* 5x2 Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            marginTop: '32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          }}
        >
          {[
            { name: 'Hostel Admin', icon: Building2 },
            { name: 'Academics / HOD', icon: GraduationCap },
            { name: 'Exam Cell', icon: Landmark },
            { name: 'Placement Cell', icon: Briefcase },
            { name: 'Library', icon: Library },
            { name: 'Health Center', icon: HeartPulse },
            { name: 'IT Services', icon: Wifi },
            { name: 'Sports Dept', icon: Trophy },
            { name: 'Security', icon: ShieldCheck },
            { name: 'Admin Office', icon: Building },
          ].map((dept, idx) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.name}
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  borderRight: idx % 5 !== 4 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  borderBottom: idx < 5 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={24} color="#0B0B12" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0B0B12' }}>{dept.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BENCHMARKS SECTION */}
      <section style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Left Panel */}
        <div style={{ backgroundColor: '#0B0B12', color: '#ffffff', padding: '64px clamp(24px, 5vw, 80px)', display: 'flex', flexDirection: 'column', justify: 'center', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.1em', marginBottom: '16px' }}>
            BENCHMARKS
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
            Faster resolution at every SLA tier
          </h2>
          <p style={{ fontSize: '15px', color: '#8B8B9A', marginBottom: '32px', maxWidth: '440px', lineHeight: 1.5 }}>
            Illustrative pilot targets against the tools most departments run on today.
          </p>

          {/* Tab List */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['Accuracy', 'Latency', 'Coverage'].map((tab) => {
              const isActive = activeBenchmarkTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveBenchmarkTab(tab)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: isActive ? '#ffffff' : '#8B8B9A',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderLeft: isActive ? '4px solid #3D4FFF' : '4px solid transparent',
                    borderTop: 0,
                    borderRight: 0,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    borderRadius: 0,
                    minHeight: 'auto',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ backgroundColor: '#F1F0EC', padding: '64px clamp(24px, 5vw, 80px)', display: 'flex', alignItems: 'center', justify: 'center' }}>
          <div style={{ backgroundColor: '#0B0B12', color: '#ffffff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '540px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', textAlign: 'left' }}>
            {/* Legend Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3D4FFF' }} />
                <span>GIOP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#8B8B9A' }} />
                <span>Generic helpdesk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#B97A5C' }} />
                <span>Manual / email</span>
              </div>
            </div>

            {/* Bar Chart Clusters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'flex-end', height: '220px' }}>
              {currentChartGroups.map((group) => (
                <div key={group.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  {/* Bars Container */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', width: '100%', justifyContent: 'center', height: '160px' }}>
                    {/* Bar 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>{group.giop}{group.suffix}</span>
                      <div style={{ width: '100%', maxWidth: '24px', backgroundColor: '#3D4FFF', borderRadius: '3px 3px 0 0', height: `${group.giop}%`, transition: 'height 0.4s ease' }} />
                    </div>
                    {/* Bar 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>{group.helpdesk}{group.suffix}</span>
                      <div style={{ width: '100%', maxWidth: '24px', backgroundColor: '#8B8B9A', borderRadius: '3px 3px 0 0', height: `${group.helpdesk}%`, transition: 'height 0.4s ease' }} />
                    </div>
                    {/* Bar 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>{group.manual}{group.suffix}</span>
                      <div style={{ width: '100%', maxWidth: '24px', backgroundColor: '#B97A5C', borderRadius: '3px 3px 0 0', height: `${group.manual}%`, transition: 'height 0.4s ease' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textAlign: 'center', marginTop: '12px' }}>{group.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLOSING CTA + FOOTER BAND */}
      <footer style={{ backgroundColor: '#3D4FFF', color: '#ffffff', padding: '64px clamp(24px, 5vw, 80px)', textAlign: 'left' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', marginBottom: '16px' }}>
            GIOP PLATFORM
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.08, maxWidth: '640px', marginBottom: '48px' }}>
            Imagine grievances that resolve themselves.
          </h2>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', margin: '40px 0' }} />

          {/* 5-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px', fontSize: '14px' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Product</div>
              {['Pricing', 'Dashboard', 'Intake API', 'Analytics'].map((item) => (
                <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {item}
                </a>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Institution</div>
              {['About GIOP', 'Careers', 'Blog', 'Changelog'].map((item) => (
                <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {item}
                </a>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Departments</div>
              {['Hostel', 'Exam Cell', 'Academics', 'Admin'].map((item) => (
                <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {item}
                </a>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Resources</div>
              {['Research', 'Trust Center', 'Security', 'Docs'].map((item) => (
                <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {item}
                </a>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>Connect</div>
              {['Contact', 'Twitter', 'LinkedIn', 'GitHub'].map((item) => (
                <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 500 }}>
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '32px', marginTop: '48px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.6)', gap: '16px' }}>
            <div>© 2026 GIOP Platform. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Privacy</a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
