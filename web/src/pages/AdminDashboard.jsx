import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  ScrollText,
  Bell,
  Search,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  RefreshCw,
  LogOut,
  X,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminDashboard() {
  const { session, logout, api, setMessage } = useAuth();
  const navigate = useNavigate();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTray, setActiveTray] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Core Data States
  const [overviews, setOverviews] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Department Drilldown & Nudge States
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptQueue, setDeptQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState({});

  // Loading State
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [auditFilter, setAuditFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [deptRes, complaintsRes, profilesRes, usersRes, auditRes, notifRes] = await Promise.allSettled([
        api('/admin/departments/overview'),
        api('/complaints'),
        api('/admin/student-profiles'),
        api('/users'),
        api('/admin/audit-logs'),
        api('/notifications'),
      ]);

      if (deptRes.status === 'fulfilled') setOverviews(deptRes.value || []);
      if (complaintsRes.status === 'fulfilled') setAllComplaints(complaintsRes.value || []);
      if (profilesRes.status === 'fulfilled') setStudentProfiles(profilesRes.value || []);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value || []);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartmentQueue(deptName) {
    setLoadingQueue(true);
    try {
      const data = await api(`/complaints?department=${encodeURIComponent(deptName)}`);
      setDeptQueue(data);
    } catch {
      setDeptQueue(allComplaints.filter((c) => c.department === deptName));
    } finally {
      setLoadingQueue(false);
    }
  }

  function handleSelectDepartment(deptName) {
    if (selectedDept === deptName) {
      setSelectedDept(null);
      setDeptQueue([]);
    } else {
      setSelectedDept(deptName);
      fetchDepartmentQueue(deptName);
    }
  }

  async function handleNudgeComplaint(complaintId) {
    const customMessage = nudgeMsg[complaintId] || undefined;
    try {
      await api(`/admin/complaints/${complaintId}/nudge`, {
        method: 'POST',
        body: JSON.stringify({ message: customMessage }),
      });
      setMessage('Expedite notice sent to department staff!');
      setNudgeMsg((prev) => ({ ...prev, [complaintId]: '' }));
      fetchAllData();
    } catch (err) {
      setMessage(err.message || 'Failed to send nudge');
    }
  }

  async function handleNudgeDepartment(deptName) {
    try {
      await api(`/admin/departments/${encodeURIComponent(deptName)}/nudge`, {
        method: 'POST',
        body: JSON.stringify({
          message: `ADMIN ESCALATION: Immediate review required for pending ${deptName} queue.`,
        }),
      });
      setMessage(`Urgent nudge dispatched to ${deptName} staff!`);
      fetchAllData();
    } catch (err) {
      setMessage(err.message || 'Failed to send department nudge');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Aggregate Metrics
  const totalComplaints = useMemo(() => overviews.reduce((acc, curr) => acc + curr.total, 0), [overviews]);
  const totalOpen = useMemo(() => overviews.reduce((acc, curr) => acc + curr.open, 0), [overviews]);
  const totalInProgress = useMemo(() => overviews.reduce((acc, curr) => acc + curr.in_progress, 0), [overviews]);
  const totalResolved = useMemo(() => overviews.reduce((acc, curr) => acc + curr.resolved, 0), [overviews]);
  const totalOverdue = useMemo(() => overviews.reduce((acc, curr) => acc + curr.overdue, 0), [overviews]);
  const actionQueueTotal = totalOpen + totalInProgress;

  const overdueComplaintsList = useMemo(() => {
    const now = new Date();
    return allComplaints.filter(
      (c) => c.status !== 'resolved' && c.status !== 'closed' && c.sla_due_at && new Date(c.sla_due_at) < now
    );
  }, [allComplaints]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentProfiles;
    const query = studentSearch.toLowerCase();
    return studentProfiles.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(query) ||
        s.prn_number?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query) ||
        s.user_email?.toLowerCase().includes(query) ||
        s.username?.toLowerCase().includes(query)
    );
  }, [studentProfiles, studentSearch]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (userRoleFilter === 'all') return usersList;
    return usersList.filter((u) => u.role === userRoleFilter);
  }, [usersList, userRoleFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === 'all') return auditLogs;
    return auditLogs.filter((a) => a.action.toLowerCase().includes(auditFilter.toLowerCase()));
  }, [auditLogs, auditFilter]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f2', color: '#111111', fontFamily: '"DM Sans", Inter, sans-serif' }}>
      {/* ─── LEFT SIDEBAR NAV ─────────────────────────────────────────────────── */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #d9d9d3',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo & Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #d9d9d3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#4b5cff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800 }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#111111', lineHeight: 1.1 }}>Resolve</div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6e6a', fontWeight: 700 }}>Governance</div>
            </div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#eef0ff', color: '#3948e8', border: '1px solid rgba(75, 92, 255, 0.2)' }}>
            v2.4
          </span>
        </div>

        {/* Admin Identity Block (Mirrors "Resolve Admin" in screenshot) */}
        <div
          style={{
            margin: '16px',
            padding: '12px 14px',
            backgroundColor: '#f5f5f2',
            borderRadius: '14px',
            border: '1px solid #d9d9d3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1px solid #d9d9d3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5cff' }}>
              <Shield size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111111', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {session?.username || 'Resolve Admin'}
              </div>
              <div style={{ fontSize: '11px', color: '#6e6e6a', fontWeight: 500 }}>Administrator</div>
            </div>
          </div>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 0 3px #d1fae5', flexShrink: 0 }} />
        </div>

        {/* Navigation Sections */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, badge: totalOverdue > 0 ? totalOverdue : null },
            { id: 'departments', label: 'Departments', icon: <Building2 size={16} />, count: 10 },
            { id: 'students', label: 'Registered Students', icon: <GraduationCap size={16} />, count: studentProfiles.length },
            { id: 'users', label: 'Users', icon: <Users size={16} />, count: usersList.length },
            { id: 'audit', label: 'System Audit & Logs', icon: <ScrollText size={16} /> },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'dashboard') setSelectedDept(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#111111' : 'transparent',
                  color: isActive ? '#ffffff' : '#6e6e6a',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && !item.badge && (
                  <span style={{ fontSize: '11px', opacity: 0.6, fontFamily: 'monospace' }}>{item.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#6e6e6a' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Live System
            </span>
            <span style={{ fontFamily: 'monospace' }}>{allComplaints.length} Records</span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* ─── TOP BAR ───────────────────────────────────────────────────────── */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #d9d9d3',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Breadcrumbs & Filter Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6e6e6a', fontWeight: 600 }}>
              <span>Pages</span>
              <ChevronRight size={14} />
              <span style={{ color: '#111111', fontWeight: 800, textTransform: 'capitalize' }}>
                {activeTab === 'audit' ? 'Audit & Sign-in Activity Logs' : activeTab}
              </span>
            </div>

            <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '16px', backgroundColor: '#f5f5f2', color: '#111111', border: '1px solid #d9d9d3' }}>
              Cohort: Institutional 2026
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '16px', backgroundColor: '#eef0ff', color: '#3948e8', border: '1px solid rgba(75, 92, 255, 0.2)' }}>
              Saved view: Today&apos;s priorities
            </span>
          </div>

          {/* Quick Actions & Notifications & Admin Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('students')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: '#f5f5f2',
                color: '#111111',
                border: '1px solid #d9d9d3',
                cursor: 'pointer',
              }}
            >
              <Search size={14} color="#6e6e6a" /> Search student
            </button>

            <button
              onClick={fetchAllData}
              title="Refresh Data"
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid #d9d9d3',
                backgroundColor: '#ffffff',
                color: '#6e6e6a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Notification Bell with Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid #d9d9d3',
                  backgroundColor: '#ffffff',
                  color: '#6e6e6a',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '10px' }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #d9d9d3',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    padding: '16px',
                    zIndex: 50,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #d9d9d3', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#111111' }}>Notifications & Nudges</span>
                    <span style={{ fontSize: '10px', color: '#6e6e6a', fontFamily: 'monospace' }}>{notifications.length} total</span>
                  </div>

                  <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#6e6e6a', textAlign: 'center', padding: '16px 0' }}>No notifications found.</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div key={n.id} style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f5f5f2', fontSize: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#111111', fontSize: '11px', marginBottom: '2px' }}>{n.subject}</div>
                          <p style={{ color: '#6e6e6a', fontSize: '11px', lineHeight: 1.3, margin: 0 }}>{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #d9d9d3' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#111111', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                {session?.username ? session.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111111' }}>
                {session?.username || 'Resolve Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* ─── BODY CONTENT BY ACTIVE TAB ─────────────────────────────────────── */}
        <main style={{ padding: '28px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* =========================================================================
              DASHBOARD TAB (Hero + Status Pills + Stat Cards + All Depts + Right Rail)
             ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
              {/* Left / Center 8-column block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* HERO PANEL: "What needs your attention today." (Matches screenshot) */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '32px',
                    border: '1px solid #d9d9d3',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      backgroundColor: '#eef0ff',
                      color: '#3948e8',
                      marginBottom: '12px',
                      border: '1px solid rgba(75, 92, 255, 0.2)',
                    }}
                  >
                    Mentor Dashboard
                  </span>

                  <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111111', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
                    What needs your attention today.
                  </h1>
                  <p style={{ fontSize: '14px', color: '#6e6e6a', lineHeight: 1.5, margin: '0 0 24px 0', maxWidth: '640px' }}>
                    Review open student grievances, monitor department resolution SLAs, and expedite escalated bottlenecks without leaving the dashboard shell.
                  </p>

                  {/* Status Pills Row (Matches screenshot's pill row) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#eef0ff', border: '1px solid #d9d9d3', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ textTransform: 'uppercase', color: '#6e6e6a', fontSize: '11px' }}>In Progress</span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#3948e8', fontWeight: 800 }}>{totalInProgress}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#eef0ff', border: '1px solid #d9d9d3', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ textTransform: 'uppercase', color: '#6e6e6a', fontSize: '11px' }}>Open Queue</span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#d97706', fontWeight: 800 }}>{totalOpen}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                      <span style={{ textTransform: 'uppercase', color: '#dc2626', fontSize: '11px' }}>Overdue</span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#dc2626', fontWeight: 800 }}>{totalOverdue}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#eef0ff', border: '1px solid #d9d9d3', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ textTransform: 'uppercase', color: '#6e6e6a', fontSize: '11px' }}>Resolved</span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#10b981', fontWeight: 800 }}>{totalResolved}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#eef0ff', border: '1px solid #d9d9d3', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ textTransform: 'uppercase', color: '#6e6e6a', fontSize: '11px' }}>Action Queue</span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#111111', fontWeight: 800 }}>{actionQueueTotal}</span>
                    </div>
                  </div>

                  {/* 2-3 Stat Cards Row inside Hero (Matches screenshot cards) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div style={{ backgroundColor: '#f5f5f2', padding: '20px', borderRadius: '16px', border: '1px solid #d9d9d3' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#6e6e6a' }}>Action Queue</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#111111', marginTop: '4px', fontFamily: 'monospace' }}>{actionQueueTotal}</div>
                      <p style={{ fontSize: '12px', color: '#6e6e6a', margin: '4px 0 0 0' }}>Total active complaints across all 10 departments.</p>
                    </div>

                    <div style={{ backgroundColor: '#f5f5f2', padding: '20px', borderRadius: '16px', border: '1px solid #d9d9d3' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#dc2626' }}>Overdue Queue</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#dc2626', marginTop: '4px', fontFamily: 'monospace' }}>{totalOverdue}</div>
                      <p style={{ fontSize: '12px', color: '#6e6e6a', margin: '4px 0 0 0' }}>Complaints exceeding resolution timeframes.</p>
                    </div>

                    <div style={{ backgroundColor: '#f5f5f2', padding: '20px', borderRadius: '16px', border: '1px solid #d9d9d3' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#3948e8' }}>Registered Students</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#3948e8', marginTop: '4px', fontFamily: 'monospace' }}>{studentProfiles.length}</div>
                      <p style={{ fontSize: '12px', color: '#6e6e6a', margin: '4px 0 0 0' }}>Verified academic student records in database.</p>
                    </div>
                  </div>
                </div>

                {/* ALL DEPARTMENTS TABLE & DRILL-DOWN QUEUE */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '28px',
                    border: '1px solid #d9d9d3',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #d9d9d3', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111111', margin: 0 }}>Institutional Departments</h2>
                      <p style={{ fontSize: '12px', color: '#6e6e6a', margin: '2px 0 0 0' }}>Click any department row to view its live queue and issue expedite notices.</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', backgroundColor: '#f5f5f2', color: '#6e6e6a', border: '1px solid #d9d9d3' }}>
                      10 Departments
                    </span>
                  </div>

                  {/* Department Table Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {overviews.map((dept) => {
                      const isSelected = selectedDept === dept.department;
                      const hasOverdue = dept.overdue > 0;

                      return (
                        <div
                          key={dept.department}
                          style={{
                            borderRadius: '14px',
                            border: isSelected ? '1.5px solid #4b5cff' : '1px solid #d9d9d3',
                            backgroundColor: isSelected ? '#f8f9ff' : '#ffffff',
                            overflow: 'hidden',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            onClick={() => handleSelectDepartment(dept.department)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 18px',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4b5cff' }} />
                              <strong style={{ fontSize: '14px', color: '#111111' }}>{dept.department}</strong>
                              {hasOverdue && (
                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                  {dept.overdue} overdue
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px' }}>
                              <span>Total: <strong>{dept.total}</strong></span>
                              <span style={{ color: '#d97706' }}>Open: <strong>{dept.open}</strong></span>
                              <span style={{ color: '#3948e8' }}>In Progress: <strong>{dept.in_progress}</strong></span>
                              <span style={{ color: '#10b981' }}>Resolved: <strong>{dept.resolved}</strong></span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleSelectDepartment(dept.department)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  backgroundColor: isSelected ? '#4b5cff' : '#f5f5f2',
                                  color: isSelected ? '#ffffff' : '#111111',
                                  border: isSelected ? 'none' : '1px solid #d9d9d3',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Eye size={12} /> {isSelected ? 'Close' : 'View Queue'}
                              </button>
                              <button
                                onClick={() => handleNudgeDepartment(dept.department)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  cursor: 'pointer',
                                }}
                              >
                                Nudge
                              </button>
                            </div>
                          </div>

                          {/* Expanded Queue Drawer */}
                          {isSelected && (
                            <div style={{ padding: '16px 18px', backgroundColor: '#f5f5f2', borderTop: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111111' }}>
                                  Live {dept.department} Complaint Queue ({deptQueue.length} items)
                                </span>
                                <button
                                  onClick={() => handleNudgeDepartment(dept.department)}
                                  style={{
                                    padding: '6px 14px',
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Expedite All
                                </button>
                              </div>

                              {loadingQueue ? (
                                <p style={{ fontSize: '12px', color: '#6e6e6a', textAlign: 'center', padding: '16px 0' }}>Loading live department queue…</p>
                              ) : deptQueue.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, textAlign: 'center', padding: '16px 0' }}>
                                  ✓ No active complaints in {dept.department} department.
                                </p>
                              ) : (
                                deptQueue.map((c) => {
                                  const isOverdue = c.sla_due_at && new Date(c.sla_due_at) < new Date() && c.status !== 'resolved' && c.status !== 'closed';

                                  return (
                                    <div
                                      key={c.id}
                                      style={{
                                        padding: '14px',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '12px',
                                        border: isOverdue ? '1px solid #f87171' : '1px solid #d9d9d3',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <strong style={{ fontSize: '13px', color: '#111111' }}>{c.title}</strong>
                                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', backgroundColor: c.status === 'open' ? '#fef3c7' : '#eef0ff', color: c.status === 'open' ? '#92400e' : '#3948e8' }}>
                                            {c.status}
                                          </span>
                                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6e6e6a' }}>Priority: {c.priority}</span>
                                          {isOverdue && (
                                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', backgroundColor: '#dc2626', color: '#ffffff' }}>
                                              SLA Overdue
                                            </span>
                                          )}
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#6e6e6a', fontFamily: 'monospace' }}>#{c.id.substring(0, 8)}</span>
                                      </div>

                                      <p style={{ fontSize: '12px', color: '#6e6e6a', margin: 0, lineHeight: 1.4 }}>{c.description}</p>

                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f1f5f9', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '11px', color: '#6e6e6a' }}>
                                          Student ID: #{c.student_id} · Filed: {new Date(c.created_at).toLocaleDateString()}
                                        </span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <input
                                            type="text"
                                            placeholder="Expedite note…"
                                            value={nudgeMsg[c.id] || ''}
                                            onChange={(e) => setNudgeMsg({ ...nudgeMsg, [c.id]: e.target.value })}
                                            style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d9d9d3', width: '140px', minHeight: 'auto' }}
                                          />
                                          <button
                                            onClick={() => handleNudgeComplaint(c.id)}
                                            style={{ fontSize: '11px', fontWeight: 700, padding: '5px 10px', borderRadius: '6px', backgroundColor: '#4b5cff', color: '#ffffff', border: 'none', cursor: 'pointer', minHeight: 'auto' }}
                                          >
                                            Nudge
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right 4-column Rail: Actionable Trays (Matches screenshot) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Tray Card 1: Review Registrations */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px', color: '#111111' }}>Review Results</strong>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                      {studentProfiles.length} READY
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6e6e6a', lineHeight: 1.45, margin: 0 }}>
                    Open a compact review tray with only students whose profiles are complete and awaiting administrative review.
                  </p>
                  <button
                    onClick={() => setActiveTray('students')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: '#4b5cff',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Open tray <ArrowRight size={14} />
                  </button>
                </div>

                {/* Tray Card 2: Live Activity Logs */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px', color: '#111111' }}>Live Activity Logs</strong>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#eef0ff', color: '#3948e8' }}>
                      LIVE STREAM
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6e6e6a', lineHeight: 1.45, margin: 0 }}>
                    Surface recent user sign-ins, student registrations, and administrative transitions in real-time.
                  </p>
                  <button
                    onClick={() => setActiveTray('audit')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: '#4b5cff',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Open tray <ArrowRight size={14} />
                  </button>
                </div>

                {/* Tray Card 3: Overdue Complaints */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px', color: '#111111' }}>Overdue Complaints</strong>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                      {totalOverdue} WAITING
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6e6e6a', lineHeight: 1.45, margin: 0 }}>
                    Show complaints waiting past SLA limits with quick actions to expedite or flag bottlenecked queues.
                  </p>
                  <button
                    onClick={() => setActiveTray('overdue')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: '#4b5cff',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Open tray <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              DEPARTMENTS VIEW
             ========================================================================= */}
          {activeTab === 'departments' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #d9d9d3' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111111', margin: 0 }}>Institutional Departments</h2>
                  <p style={{ fontSize: '13px', color: '#6e6e6a', margin: '4px 0 0 0' }}>Comprehensive department resolution status and breakdown.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {overviews.map((d) => (
                  <div key={d.department} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #d9d9d3', backgroundColor: '#f5f5f2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '14px', color: '#111111' }}>{d.department}</strong>
                      {d.overdue > 0 && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800 }}>{d.overdue} Overdue</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6e6e6a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Total: <strong>{d.total}</strong></div>
                      <div>Open: <strong style={{ color: '#d97706' }}>{d.open}</strong></div>
                      <div>In Progress: <strong style={{ color: '#3948e8' }}>{d.in_progress}</strong></div>
                      <div>Resolved: <strong style={{ color: '#10b981' }}>{d.resolved}</strong></div>
                    </div>
                    <button
                      onClick={() => handleNudgeDepartment(d.department)}
                      style={{ marginTop: 'auto', padding: '6px', fontSize: '11px', fontWeight: 700, borderRadius: '8px', backgroundColor: '#4b5cff', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                    >
                      Nudge Dept
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              REGISTERED STUDENTS VIEW
             ========================================================================= */}
          {activeTab === 'students' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #d9d9d3' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111111', margin: 0 }}>Registered Student Profiles</h2>
                  <p style={{ fontSize: '13px', color: '#6e6e6a', margin: '4px 0 0 0' }}>Official student profiles with institutional PRN registration.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, PRN, dept…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ width: '260px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #d9d9d3', fontSize: '12px' }}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #d9d9d3', color: '#6e6e6a', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 8px' }}>Full Name</th>
                      <th style={{ padding: '10px 8px' }}>PRN Number</th>
                      <th style={{ padding: '10px 8px' }}>Department</th>
                      <th style={{ padding: '10px 8px' }}>Roll / Div</th>
                      <th style={{ padding: '10px 8px' }}>Year / Sem</th>
                      <th style={{ padding: '10px 8px' }}>Contact</th>
                      <th style={{ padding: '10px 8px' }}>Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#111111' }}>{s.full_name}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#3948e8' }}>{s.prn_number}</td>
                        <td style={{ padding: '12px 8px' }}>{s.department}</td>
                        <td style={{ padding: '12px 8px', color: '#6e6e6a' }}>{s.roll_no} / {s.division}</td>
                        <td style={{ padding: '12px 8px', color: '#6e6e6a' }}>{s.year_semester}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#6e6e6a' }}>{s.contact_number}</td>
                        <td style={{ padding: '12px 8px', color: '#6e6e6a' }}>{s.user_email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              USERS MANAGEMENT VIEW
             ========================================================================= */}
          {activeTab === 'users' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #d9d9d3' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111111', margin: 0 }}>Registered Users</h2>
                  <p style={{ fontSize: '13px', color: '#6e6e6a', margin: '4px 0 0 0' }}>All accounts across student, staff, and admin roles.</p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'student', 'staff', 'admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setUserRoleFilter(role)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: userRoleFilter === role ? '#111111' : '#f5f5f2',
                        color: userRoleFilter === role ? '#ffffff' : '#6e6e6a',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #d9d9d3', color: '#6e6e6a', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 8px' }}>User ID</th>
                      <th style={{ padding: '10px 8px' }}>Email</th>
                      <th style={{ padding: '10px 8px' }}>Username</th>
                      <th style={{ padding: '10px 8px' }}>Role</th>
                      <th style={{ padding: '10px 8px' }}>Department</th>
                      <th style={{ padding: '10px 8px' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#6e6e6a' }}>#{u.id}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#111111' }}>{u.email}</td>
                        <td style={{ padding: '12px 8px', color: '#3948e8', fontFamily: 'monospace' }}>@{u.username || '—'}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: u.role === 'admin' ? '#ede9fe' : u.role === 'staff' ? '#eef0ff' : '#f1f5f9', color: u.role === 'admin' ? '#6b21a8' : u.role === 'staff' ? '#3948e8' : '#334155' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#6e6e6a' }}>{u.department || '— (All)'}</td>
                        <td style={{ padding: '12px 8px', color: '#6e6e6a', fontFamily: 'monospace' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              SYSTEM AUDIT & ACTIVITY LOGS VIEW
             ========================================================================= */}
          {activeTab === 'audit' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #d9d9d3', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #d9d9d3' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111111', margin: 0 }}>System Audit &amp; Sign-in Activity Logs</h2>
                  <p style={{ fontSize: '13px', color: '#6e6e6a', margin: '4px 0 0 0' }}>Security telemetry tracking sign-ins, registrations, and escalations.</p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'login', 'register', 'nudge', 'complaint'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setAuditFilter(f)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: auditFilter === f ? '#111111' : '#f5f5f2',
                        color: auditFilter === f ? '#ffffff' : '#6e6e6a',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #d9d9d3', color: '#6e6e6a', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 8px' }}>Timestamp</th>
                      <th style={{ padding: '10px 8px' }}>Action Event</th>
                      <th style={{ padding: '10px 8px' }}>Actor / Email</th>
                      <th style={{ padding: '10px 8px' }}>Entity Type</th>
                      <th style={{ padding: '10px 8px' }}>Entity ID</th>
                      <th style={{ padding: '10px 8px' }}>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#6e6e6a' }}>{new Date(a.created_at).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, backgroundColor: a.action.includes('login') ? '#d1fae5' : a.action.includes('nudge') ? '#fee2e2' : '#eef0ff', color: a.action.includes('login') ? '#065f46' : a.action.includes('nudge') ? '#991b1b' : '#3948e8' }}>
                            {a.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111111' }}>{a.actor_email || a.event_metadata?.email || `User #${a.user_id || 'System'}`}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#6e6e6a' }}>{a.entity_type}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#6e6e6a' }}>{a.entity_id}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: '#6e6e6a' }}>
                          {JSON.stringify(a.meta_json || a.event_metadata || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── SLIDE-OVER ACTION TRAY DRAWER ────────────────────────────────────── */}
      {activeTray && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            onClick={() => setActiveTray(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          />

          {/* Drawer Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#ffffff',
              height: '100%',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
              borderLeft: '1px solid #d9d9d3',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #d9d9d3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111111', margin: 0, textTransform: 'capitalize' }}>
                  {activeTray === 'students' && 'Registered Student Profiles'}
                  {activeTray === 'audit' && 'Live System Activity Logs'}
                  {activeTray === 'overdue' && 'Overdue Complaints Queue'}
                </h3>
                <p style={{ fontSize: '11px', color: '#6e6e6a', margin: '2px 0 0 0' }}>Actionable governance drawer</p>
              </div>
              <button
                onClick={() => setActiveTray(null)}
                style={{ padding: '6px', borderRadius: '8px', border: '1px solid #d9d9d3', backgroundColor: '#ffffff', color: '#6e6e6a', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tray Content */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTray === 'students' && (
                <>
                  {studentProfiles.slice(0, 10).map((s) => (
                    <div key={s.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f5f5f2', border: '1px solid #d9d9d3' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#111111' }}>{s.full_name}</strong>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: '#3948e8' }}>{s.prn_number}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6e6e6a' }}>
                        <div>Dept: {s.department} · Div: {s.division} · Roll: {s.roll_no}</div>
                        <div>Email: {s.user_email}</div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setActiveTray(null);
                      setActiveTab('students');
                    }}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#111111', color: '#ffffff', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px' }}
                  >
                    View All {studentProfiles.length} Students
                  </button>
                </>
              )}

              {activeTray === 'audit' && (
                <>
                  {auditLogs.slice(0, 12).map((a) => (
                    <div key={a.id} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f5f5f2', border: '1px solid #d9d9d3', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', backgroundColor: '#eef0ff', color: '#3948e8' }}>{a.action}</span>
                        <span style={{ fontSize: '10px', color: '#6e6e6a', fontFamily: 'monospace' }}>{new Date(a.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#111111', fontSize: '12px' }}>{a.actor_email || a.event_metadata?.email || `User #${a.user_id || 'System'}`}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setActiveTray(null);
                      setActiveTab('audit');
                    }}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#111111', color: '#ffffff', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px' }}
                  >
                    View Full Audit History
                  </button>
                </>
              )}

              {activeTray === 'overdue' && (
                <>
                  {overdueComplaintsList.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#10b981', fontWeight: 700, fontSize: '13px', padding: '32px 0' }}>
                      ✓ No complaints are currently overdue.
                    </p>
                  ) : (
                    overdueComplaintsList.map((c) => (
                      <div key={c.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>#{c.id.substring(0, 8)}</span>
                          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', backgroundColor: '#dc2626', color: '#ffffff' }}>Overdue</span>
                        </div>
                        <strong style={{ fontSize: '13px', color: '#111111' }}>{c.title}</strong>
                        <div style={{ fontSize: '11px', color: '#6e6e6a' }}>Dept: {c.department} · Priority: {c.priority}</div>
                        <button
                          onClick={() => handleNudgeComplaint(c.id)}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '4px' }}
                        >
                          Expedite Immediately
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
