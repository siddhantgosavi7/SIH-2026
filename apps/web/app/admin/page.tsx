"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  UserCheck,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

interface DepartmentOverview {
  department: string;
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  overdue: number;
}

interface Complaint {
  id: string;
  student_id: number;
  department: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  sla_due_at: string;
  created_at: string;
  assigned_to_id?: number | null;
  student_name?: string | null;
  student_email?: string | null;
  student_prn?: string | null;
  student_division?: string | null;
  student_roll_no?: string | null;
  student_year_semester?: string | null;
  student_contact?: string | null;
}

interface StudentProfileAdmin {
  id: number;
  user_id: number;
  full_name: string;
  department: string;
  prn_number: string;
  division: string;
  roll_no: string;
  year_semester: string;
  contact_number: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  username?: string;
}

interface UserItem {
  id: number;
  email: string;
  username?: string | null;
  role: string;
  department?: string | null;
  created_at?: string;
}

interface AuditLogItem {
  id: number;
  user_id?: number | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  meta_json?: any;
  created_at: string;
}

interface NotificationItem {
  id: number;
  complaint_id?: string | null;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  sent_at?: string | null;
  created_at: string;
}

type TabType = "dashboard" | "departments" | "students" | "users" | "audit";
type TrayType = "students" | "audit" | "overdue" | null;

export default function AdminDashboard() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [activeTray, setActiveTray] = useState<TrayType>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Core Data States
  const [overviews, setOverviews] = useState<DepartmentOverview[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfileAdmin[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Department Drilldown & Nudge States
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptQueue, setDeptQueue] = useState<Complaint[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState<{ [key: string]: string }>({});

  // Loading & Feedback States
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [auditFilter, setAuditFilter] = useState("all");

  // Check auth session
  useEffect(() => {
    const token = localStorage.getItem("token");
    const sessionStr = localStorage.getItem("session");
    if (!token || !sessionStr) {
      router.push("/login");
      return;
    }
    try {
      const session = JSON.parse(sessionStr);
      if (session.role !== "admin") {
        if (session.role === "staff" || session.role === "department_head") {
          router.push("/department");
        } else {
          router.push("/");
        }
        return;
      }
      setAdminUser(session);
    } catch {
      router.push("/login");
      return;
    }

    fetchAllData();
  }, [router]);

  async function fetchAllData() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [deptRes, complaintsRes, profilesRes, usersRes, auditRes, notifRes] = await Promise.allSettled([
        fetch(`${apiBase}/admin/departments/overview`, { headers }),
        fetch(`${apiBase}/complaints`, { headers }),
        fetch(`${apiBase}/admin/student-profiles`, { headers }),
        fetch(`${apiBase}/users`, { headers }),
        fetch(`${apiBase}/admin/audit-logs`, { headers }),
        fetch(`${apiBase}/notifications`, { headers }),
      ]);

      if (deptRes.status === "fulfilled" && deptRes.value.ok) {
        const data = await deptRes.value.json();
        setOverviews(data);
      }
      if (complaintsRes.status === "fulfilled" && complaintsRes.value.ok) {
        const data = await complaintsRes.value.json();
        setAllComplaints(data);
      }
      if (profilesRes.status === "fulfilled" && profilesRes.value.ok) {
        const data = await profilesRes.value.json();
        setStudentProfiles(data);
      }
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data = await usersRes.value.json();
        setUsersList(data);
      }
      if (auditRes.status === "fulfilled" && auditRes.value.ok) {
        const data = await auditRes.value.json();
        setAuditLogs(data);
      }
      if (notifRes.status === "fulfilled" && notifRes.value.ok) {
        const data = await notifRes.value.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartmentQueue(deptName: string) {
    setLoadingQueue(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(`${apiBase}/complaints?department=${encodeURIComponent(deptName)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDeptQueue(data);
      } else {
        // Fallback filter client-side if query filter not supported
        setDeptQueue(allComplaints.filter((c) => c.department === deptName));
      }
    } catch {
      setDeptQueue(allComplaints.filter((c) => c.department === deptName));
    } finally {
      setLoadingQueue(false);
    }
  }

  function handleSelectDepartment(deptName: string) {
    if (selectedDept === deptName) {
      setSelectedDept(null);
      setDeptQueue([]);
    } else {
      setSelectedDept(deptName);
      fetchDepartmentQueue(deptName);
    }
  }

  async function handleNudgeComplaint(complaintId: string) {
    const token = localStorage.getItem("token");
    const customMessage = nudgeMsg[complaintId] || undefined;
    try {
      const res = await fetch(`${apiBase}/admin/complaints/${complaintId}/nudge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: customMessage }),
      });
      if (res.ok) {
        showToast("Expedite notice sent to department staff!", "success");
        setNudgeMsg((prev) => ({ ...prev, [complaintId]: "" }));
        fetchAllData();
      } else {
        showToast("Failed to send nudge", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    }
  }

  async function handleNudgeDepartment(deptName: string) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase}/admin/departments/${encodeURIComponent(deptName)}/nudge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `ADMIN ESCALATION: Immediate review required for pending ${deptName} queue.`,
        }),
      });
      if (res.ok) {
        showToast(`Urgent nudge dispatched to ${deptName} staff & department queue!`, "success");
        fetchAllData();
      } else {
        showToast("Failed to send department nudge", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
    router.push("/login");
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
      (c) => c.status !== "resolved" && c.status !== "closed" && c.sla_due_at && new Date(c.sla_due_at) < now
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
    if (userRoleFilter === "all") return usersList;
    return usersList.filter((u) => u.role === userRoleFilter);
  }, [usersList, userRoleFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === "all") return auditLogs;
    return auditLogs.filter((a) => a.action.toLowerCase().includes(auditFilter.toLowerCase()));
  }, [auditLogs, auditFilter]);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col md:flex-row antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-2.5 text-white transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* ─── LEFT SIDEBAR NAV ─────────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-[var(--line)] flex flex-col shrink-0">
        {/* Logo & Brand Header */}
        <div className="p-6 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--blue)] flex items-center justify-center text-white shadow-sm font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[var(--ink)]">Resolve</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--muted)] block -mt-1 font-semibold">
                Governance
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-[var(--soft-blue)] text-[var(--blue-dark)] text-[10px] font-bold rounded-full border border-[var(--blue)]/20">
            v2.4
          </span>
        </div>

        {/* Admin Identity Block (Mirrors "Resolve Admin" in screenshot) */}
        <div className="p-4 mx-4 my-4 bg-[var(--paper)] rounded-2xl border border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-[var(--line)] flex items-center justify-center text-[var(--ink)] font-bold text-sm shadow-sm">
              <Shield className="w-5 h-5 text-[var(--blue)]" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[var(--ink)] truncate">
                {adminUser?.username || "Resolve Admin"}
              </div>
              <div className="text-[11px] text-[var(--muted)] truncate font-medium">Administrator</div>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedDept(null);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-[var(--ink)] text-white shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="flex-1 text-left">Dashboard</span>
            {totalOverdue > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-mono font-bold">
                {totalOverdue}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("departments")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "departments"
                ? "bg-[var(--ink)] text-white shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="flex-1 text-left">Departments</span>
            <span className="text-[10px] font-mono opacity-70">10</span>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "students"
                ? "bg-[var(--ink)] text-white shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="flex-1 text-left">Registered Students</span>
            <span className="text-[10px] font-mono opacity-70">{studentProfiles.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "users"
                ? "bg-[var(--ink)] text-white shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="flex-1 text-left">Users</span>
            <span className="text-[10px] font-mono opacity-70">{usersList.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "audit"
                ? "bg-[var(--ink)] text-white shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span className="flex-1 text-left">System Audit & Logs</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--line)] space-y-2">
          <div className="px-3 py-2 bg-[var(--paper)] rounded-xl flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Backend Live
            </span>
            <span className="font-mono text-[10px]">{allComplaints.length} Records</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ─── TOP BAR ───────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-[var(--line)] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          {/* Breadcrumbs & Active Filter Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>Pages</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--ink)] font-bold capitalize">
                {activeTab === "audit" ? "Audit & Activity Logs" : activeTab}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <span className="px-3 py-1 bg-[var(--paper)] text-[var(--ink)] text-[11px] font-semibold rounded-full border border-[var(--line)]">
                Cohort: Institutional 2026
              </span>
              <span className="px-3 py-1 bg-[var(--soft-blue)] text-[var(--blue-dark)] text-[11px] font-semibold rounded-full border border-[var(--blue)]/20">
                Saved view: Today&apos;s priorities
              </span>
            </div>
          </div>

          {/* Action Buttons & Notifications & Admin Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("students")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--paper)] hover:bg-slate-200 text-[var(--ink)] text-xs font-bold rounded-xl border border-[var(--line)] transition"
            >
              <Search className="w-3.5 h-3.5 text-[var(--muted)]" /> Search student
            </button>

            <button
              onClick={fetchAllData}
              className="p-2 rounded-xl border border-[var(--line)] hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] transition"
              title="Refresh platform data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--blue)]" : ""}`} />
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl border border-[var(--line)] hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {notifications.length > 99 ? "99+" : notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[var(--line)] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-3">
                    <div className="font-extrabold text-xs text-[var(--ink)] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[var(--blue)]" /> Notifications & Nudges
                    </div>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {notifications.length} alerts
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[var(--muted)]">
                        No notifications currently.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line)] text-xs space-y-1"
                        >
                          <div className="font-bold text-[var(--ink)] text-[11px] flex items-center justify-between">
                            <span className="truncate">{n.subject}</span>
                            <span className="text-[10px] font-normal text-[var(--muted)]">
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] leading-relaxed">{n.body}</p>
                          <div className="text-[9px] font-mono text-[var(--blue-dark)]">To: {n.recipient}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Badge Pill (Mirrors top-right user pill in screenshot) */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--line)]">
              <div className="w-7 h-7 rounded-full bg-[var(--ink)] text-white flex items-center justify-center text-xs font-extrabold">
                {adminUser?.username ? adminUser.username.charAt(0).toUpperCase() : "A"}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-[var(--ink)]">
                {adminUser?.username || "Resolve Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* ─── BODY CONTENT BY ACTIVE TAB ─────────────────────────────────────── */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-8">
          {/* =========================================================================
              DASHBOARD TAB (Hero + Status Pills + Stat Cards + All Depts + Right Rail)
             ========================================================================= */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left / Center 8-column block */}
              <div className="lg:col-span-8 space-y-8">
                {/* HERO PANEL: "What needs your attention today." (Matches screenshot) */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xs relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-[var(--soft-blue)] text-[var(--blue-dark)] text-[10px] font-bold tracking-wider rounded-full uppercase border border-[var(--blue)]/20">
                      Governance Oversight
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight mb-2">
                    What needs your attention today.
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--muted)] font-medium max-w-2xl leading-relaxed mb-6">
                    Review open student grievances, monitor department resolution SLAs, and expedite escalated bottlenecks without leaving the dashboard shell.
                  </p>

                  {/* Status Pills Row (Matches screenshot's pill row) */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-8">
                    <div className="px-3.5 py-1.5 bg-[var(--soft-blue)] text-[var(--ink)] text-xs font-bold rounded-full border border-[var(--line)] flex items-center gap-2">
                      <span className="text-[var(--muted)] font-medium text-[11px] uppercase tracking-wider">
                        In Progress
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-[var(--blue-dark)] font-mono text-xs font-extrabold shadow-xs">
                        {totalInProgress}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 bg-[var(--soft-blue)] text-[var(--ink)] text-xs font-bold rounded-full border border-[var(--line)] flex items-center gap-2">
                      <span className="text-[var(--muted)] font-medium text-[11px] uppercase tracking-wider">
                        Open Queue
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-amber-600 font-mono text-xs font-extrabold shadow-xs">
                        {totalOpen}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 flex items-center gap-2">
                      <span className="text-red-600 font-medium text-[11px] uppercase tracking-wider">
                        SLA Overdue
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-red-600 font-mono text-xs font-extrabold shadow-xs">
                        {totalOverdue}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 bg-[var(--soft-blue)] text-[var(--ink)] text-xs font-bold rounded-full border border-[var(--line)] flex items-center gap-2">
                      <span className="text-[var(--muted)] font-medium text-[11px] uppercase tracking-wider">
                        Resolved
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-emerald-600 font-mono text-xs font-extrabold shadow-xs">
                        {totalResolved}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 bg-[var(--soft-blue)] text-[var(--ink)] text-xs font-bold rounded-full border border-[var(--line)] flex items-center gap-2">
                      <span className="text-[var(--muted)] font-medium text-[11px] uppercase tracking-wider">
                        Total Action
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-[var(--ink)] font-mono text-xs font-extrabold shadow-xs">
                        {actionQueueTotal}
                      </span>
                    </div>
                  </div>

                  {/* 2-3 Stat Cards Row inside Hero (Matches screenshot cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[var(--paper)] p-5 rounded-2xl border border-[var(--line)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Action Queue
                      </span>
                      <div className="text-3xl font-extrabold text-[var(--ink)] mt-1 font-mono">
                        {actionQueueTotal}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1">
                        Active complaints across all 10 departments.
                      </p>
                    </div>

                    <div className="bg-[var(--paper)] p-5 rounded-2xl border border-[var(--line)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                        SLA Overdue
                      </span>
                      <div className="text-3xl font-extrabold text-red-600 mt-1 font-mono">
                        {totalOverdue}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1">
                        Complaints requiring immediate expedite notice.
                      </p>
                    </div>

                    <div className="bg-[var(--paper)] p-5 rounded-2xl border border-[var(--line)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blue-dark)]">
                        Student Profiles
                      </span>
                      <div className="text-3xl font-extrabold text-[var(--blue-dark)] mt-1 font-mono">
                        {studentProfiles.length}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1">
                        Verified student academic records in system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ALL DEPARTMENTS TABLE & DRILL-DOWN QUEUE */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
                    <div>
                      <h2 className="text-lg font-extrabold text-[var(--ink)]">Institutional Departments</h2>
                      <p className="text-xs text-[var(--muted)] font-medium">
                        Click any department to expand live complaint queue and issue expedite notices.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[var(--paper)] text-[var(--muted)] text-xs font-semibold rounded-full border border-[var(--line)] self-start sm:self-auto">
                      10 Active Units
                    </span>
                  </div>

                  {/* Departments Table List */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase text-[10px] tracking-wider">
                          <th className="pb-3 pl-2">Department</th>
                          <th className="pb-3 text-center">Total</th>
                          <th className="pb-3 text-center">Open</th>
                          <th className="pb-3 text-center">In Progress</th>
                          <th className="pb-3 text-center">Resolved</th>
                          <th className="pb-3 text-center">Overdue</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {overviews.map((dept) => {
                          const isSelected = selectedDept === dept.department;
                          const hasOverdue = dept.overdue > 0;

                          return (
                            <React.Fragment key={dept.department}>
                              <tr
                                onClick={() => handleSelectDepartment(dept.department)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-[var(--soft-blue)] font-semibold"
                                    : "hover:bg-[var(--paper)]"
                                }`}
                              >
                                <td className="py-3.5 pl-2 font-bold text-[var(--ink)] flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[var(--blue)]"></div>
                                  <span>{dept.department}</span>
                                </td>
                                <td className="py-3.5 text-center font-mono font-bold text-[var(--ink)]">
                                  {dept.total}
                                </td>
                                <td className="py-3.5 text-center font-mono font-bold text-amber-600">
                                  {dept.open}
                                </td>
                                <td className="py-3.5 text-center font-mono font-bold text-[var(--blue-dark)]">
                                  {dept.in_progress}
                                </td>
                                <td className="py-3.5 text-center font-mono font-bold text-emerald-600">
                                  {dept.resolved}
                                </td>
                                <td className="py-3.5 text-center">
                                  {hasOverdue ? (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full font-mono">
                                      {dept.overdue}
                                    </span>
                                  ) : (
                                    <span className="text-[var(--muted)] font-mono">0</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-2 text-right">
                                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleSelectDepartment(dept.department)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                        isSelected
                                          ? "bg-[var(--blue)] text-white"
                                          : "bg-[var(--paper)] hover:bg-slate-200 text-[var(--ink)] border border-[var(--line)]"
                                      }`}
                                    >
                                      <Eye className="w-3 h-3" />
                                      {isSelected ? "Close" : "Queue"}
                                    </button>
                                    <button
                                      onClick={() => handleNudgeDepartment(dept.department)}
                                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition"
                                      title="Expedite entire department"
                                    >
                                      Nudge
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Department Queue View */}
                              {isSelected && (
                                <tr>
                                  <td colSpan={7} className="p-4 bg-[var(--paper)] border-t border-b border-[var(--line)]">
                                    <div className="space-y-4">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                                        <div>
                                          <div className="text-sm font-extrabold text-[var(--ink)] flex items-center gap-2">
                                            <span>{dept.department} Live Queue</span>
                                            <span className="px-2 py-0.5 bg-white text-[var(--muted)] text-[10px] rounded-full font-mono border border-[var(--line)]">
                                              {deptQueue.length} items
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-[var(--muted)]">
                                            Direct complaint telemetry & escalation channel for {dept.department}.
                                          </p>
                                        </div>

                                        <button
                                          onClick={() => handleNudgeDepartment(dept.department)}
                                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
                                        >
                                          <Bell className="w-3.5 h-3.5" /> Expedite All in {dept.department}
                                        </button>
                                      </div>

                                      {loadingQueue ? (
                                        <div className="text-center py-8 text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                                          <RefreshCw className="w-4 h-4 animate-spin text-[var(--blue)]" /> Loading queue...
                                        </div>
                                      ) : deptQueue.length === 0 ? (
                                        <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-[var(--line)]">
                                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                                          <p className="text-xs font-bold text-[var(--ink)]">No active complaints</p>
                                          <p className="text-[11px] text-[var(--muted)]">This department queue is completely clear.</p>
                                        </div>
                                      ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                          {deptQueue.map((c) => {
                                            const isOverdue =
                                              c.sla_due_at &&
                                              new Date(c.sla_due_at) < new Date() &&
                                              c.status !== "resolved" &&
                                              c.status !== "closed";

                                            return (
                                              <div
                                                key={c.id}
                                                className={`p-4 rounded-2xl border bg-white transition space-y-3 ${
                                                  isOverdue ? "border-red-300 ring-1 ring-red-200" : "border-[var(--line)]"
                                                }`}
                                              >
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                                  <div className="space-y-1 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                      <span className="font-mono text-[10px] font-bold text-[var(--muted)]">
                                                        #{c.id.substring(0, 8)}
                                                      </span>
                                                      <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                          c.status === "open"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : c.status === "in_progress"
                                                            ? "bg-[var(--soft-blue)] text-[var(--blue-dark)]"
                                                            : "bg-emerald-100 text-emerald-800"
                                                        }`}
                                                      >
                                                        {c.status.replace("_", " ")}
                                                      </span>
                                                      <span className="px-2 py-0.5 bg-[var(--paper)] text-[var(--muted)] text-[10px] font-semibold rounded-full border border-[var(--line)]">
                                                        Priority: {c.priority}
                                                      </span>
                                                      {isOverdue && (
                                                        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                                          <Clock className="w-3 h-3" /> SLA Overdue
                                                        </span>
                                                      )}
                                                    </div>

                                                    <h4 className="font-extrabold text-sm text-[var(--ink)]">{c.title}</h4>
                                                    <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                                                      {c.description}
                                                    </p>

                                                    <div className="text-[10px] text-[var(--muted)] pt-1 flex flex-wrap gap-x-3">
                                                      <span>Student ID: #{c.student_id}</span>
                                                      {c.student_prn && <span>PRN: {c.student_prn}</span>}
                                                      <span>Created: {new Date(c.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                  </div>

                                                  {/* Expedite / Nudge Action */}
                                                  <div className="w-full md:w-64 bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] space-y-2 shrink-0">
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                                                      Expedite Notice
                                                    </label>
                                                    <input
                                                      type="text"
                                                      placeholder="Custom nudge note..."
                                                      value={nudgeMsg[c.id] || ""}
                                                      onChange={(e) => setNudgeMsg({ ...nudgeMsg, [c.id]: e.target.value })}
                                                      className="w-full text-xs p-2 rounded-lg border border-[var(--line)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
                                                    />
                                                    <button
                                                      onClick={() => handleNudgeComplaint(c.id)}
                                                      className="w-full py-1.5 bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                                                    >
                                                      <Send className="w-3 h-3" /> Nudge Staff
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right 4-column Rail: Actionable Trays (Matches screenshot's right rail) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Tray Card 1: Review Student Registrations */}
                <div className="bg-white p-6 rounded-3xl border border-[var(--line)] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[var(--ink)]">Review Results</h3>
                    <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-red-100">
                      {studentProfiles.length} Ready
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Open a compact review tray with recently registered students whose academic profiles are ready for administrative verification.
                  </p>
                  <button
                    onClick={() => setActiveTray("students")}
                    className="w-full py-2.5 px-4 bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    Open tray <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tray Card 2: Live Audit Events */}
                <div className="bg-white p-6 rounded-3xl border border-[var(--line)] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[var(--ink)]">Audit Activity</h3>
                    <span className="px-2.5 py-0.5 bg-[var(--soft-blue)] text-[var(--blue-dark)] text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-[var(--blue)]/20">
                      Live Stream
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Surface recent student logins, user registrations, administrative escalations, and SLA status transitions across the platform.
                  </p>
                  <button
                    onClick={() => setActiveTray("audit")}
                    className="w-full py-2.5 px-4 bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    Open tray <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tray Card 3: Overdue Complaints */}
                <div className="bg-white p-6 rounded-3xl border border-[var(--line)] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[var(--ink)]">Overdue Complaints</h3>
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-amber-200">
                      {totalOverdue} Waiting
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Inspect grievance bottlenecks exceeding standard SLA resolution time limits with one-click expedite escalation to staff.
                  </p>
                  <button
                    onClick={() => setActiveTray("overdue")}
                    className="w-full py-2.5 px-4 bg-[var(--blue)] hover:bg-[var(--blue-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    Open tray <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              DEPARTMENTS VIEW (Focused breakdown)
             ========================================================================= */}
          {activeTab === "departments" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--ink)]">Institutional Departments & Queues</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Real-time grievance statistics and active resolution progress per department.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--muted)]">
                    Total Complaints: <strong>{totalComplaints}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {overviews.map((dept) => {
                  const isSelected = selectedDept === dept.department;
                  const hasOverdue = dept.overdue > 0;

                  return (
                    <div
                      key={dept.department}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[var(--blue)] bg-[var(--soft-blue)]/50 ring-2 ring-[var(--blue)]/20"
                          : "border-[var(--line)] bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-extrabold text-[var(--ink)] text-sm">{dept.department}</h3>
                          {hasOverdue && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                              {dept.overdue} SLA
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-[var(--muted)] mb-5">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <strong className="text-[var(--ink)] font-mono">{dept.total}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Open:</span>
                            <strong className="text-amber-600 font-mono">{dept.open}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>In Progress:</span>
                            <strong className="text-[var(--blue-dark)] font-mono">{dept.in_progress}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Resolved:</span>
                            <strong className="text-emerald-600 font-mono">{dept.resolved}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-[var(--line)]">
                        <button
                          onClick={() => handleSelectDepartment(dept.department)}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            isSelected
                              ? "bg-[var(--blue)] text-white"
                              : "bg-[var(--paper)] hover:bg-slate-200 text-[var(--ink)] border border-[var(--line)]"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isSelected ? "Hide Queue" : "View Queue"}
                        </button>
                        <button
                          onClick={() => handleNudgeDepartment(dept.department)}
                          className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200"
                        >
                          <Bell className="w-3.5 h-3.5" /> Nudge Dept
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Department Queue */}
              {selectedDept && (
                <div className="mt-8 p-6 bg-[var(--paper)] rounded-3xl border border-[var(--line)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                    <h3 className="font-extrabold text-sm text-[var(--ink)] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[var(--blue)]" /> {selectedDept} Department Queue ({deptQueue.length} records)
                    </h3>
                    <button
                      onClick={() => handleNudgeDepartment(selectedDept)}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" /> Expedite All
                    </button>
                  </div>

                  {deptQueue.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--muted)]">
                      No complaints registered in this department.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deptQueue.map((c) => (
                        <div key={c.id} className="bg-white p-4 rounded-2xl border border-[var(--line)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[var(--muted)]">#{c.id.substring(0, 8)}</span>
                            <span className="px-2 py-0.5 bg-[var(--soft-blue)] text-[var(--blue-dark)] text-[10px] font-bold rounded-full">
                              {c.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-[var(--ink)]">{c.title}</h4>
                          <p className="text-[11px] text-[var(--muted)] line-clamp-2">{c.description}</p>
                          <div className="pt-2 flex items-center justify-between border-t border-[var(--line)] text-[10px]">
                            <span className="text-[var(--muted)]">Student #{c.student_id}</span>
                            <button
                              onClick={() => handleNudgeComplaint(c.id)}
                              className="px-2.5 py-1 bg-[var(--blue)] text-white rounded-lg font-bold hover:bg-[var(--blue-dark)] transition"
                            >
                              Nudge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              REGISTERED STUDENTS VIEW (Full table from GET /admin/student-profiles)
             ========================================================================= */}
          {activeTab === "students" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--ink)]">Registered Student Profiles</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Official academic student registry verified against institutional PRN records.
                  </p>
                </div>

                <div className="w-full sm:w-72 relative">
                  <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, PRN, dept..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">Full Name</th>
                      <th className="pb-3">PRN Number</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Roll / Div</th>
                      <th className="pb-3">Year / Sem</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">User Account</th>
                      <th className="pb-3 text-right pr-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[var(--muted)]">
                          No student profiles found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[var(--paper)] transition-colors">
                          <td className="py-3.5 pl-2 font-bold text-[var(--ink)] flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[var(--soft-blue)] text-[var(--blue-dark)] flex items-center justify-center font-bold text-xs">
                              {s.full_name?.charAt(0) || "S"}
                            </div>
                            <span>{s.full_name}</span>
                          </td>
                          <td className="py-3.5 font-mono font-bold text-[var(--blue-dark)]">{s.prn_number}</td>
                          <td className="py-3.5 font-medium">{s.department}</td>
                          <td className="py-3.5 font-mono text-[var(--muted)]">
                            {s.roll_no} / {s.division}
                          </td>
                          <td className="py-3.5 text-[var(--muted)]">{s.year_semester}</td>
                          <td className="py-3.5 font-mono text-[var(--muted)]">{s.contact_number}</td>
                          <td className="py-3.5 text-[var(--muted)]">
                            <div>{s.user_email || "—"}</div>
                            <div className="text-[10px] font-mono text-[var(--blue)]">@{s.username || `id:${s.user_id}`}</div>
                          </td>
                          <td className="py-3.5 pr-2 text-right text-[var(--muted)] font-mono text-[11px]">
                            {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              USERS MANAGEMENT VIEW (Full table from GET /users)
             ========================================================================= */}
          {activeTab === "users" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--ink)]">User Accounts & Roles</h2>
                  <p className="text-xs text-[var(--muted)]">
                    All registered accounts across student, staff, department heads, and administrators.
                  </p>
                </div>

                {/* Role Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {["all", "student", "staff", "department_head", "admin"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                        userRoleFilter === r
                          ? "bg-[var(--ink)] text-white shadow-xs"
                          : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
                      }`}
                    >
                      {r.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">User ID</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Username</th>
                      <th className="pb-3">Assigned Role</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3 text-right pr-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                          No users found with selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--paper)] transition-colors">
                          <td className="py-3.5 pl-2 font-mono font-bold text-[var(--muted)]">#{u.id}</td>
                          <td className="py-3.5 font-bold text-[var(--ink)]">{u.email}</td>
                          <td className="py-3.5 font-mono text-[var(--blue-dark)]">@{u.username || "—"}</td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : u.role === "staff" || u.role === "department_head"
                                  ? "bg-[var(--soft-blue)] text-[var(--blue-dark)]"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 font-medium text-[var(--ink)]">{u.department || "— (All)"}</td>
                          <td className="py-3.5 pr-2 text-right text-[var(--muted)] font-mono text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              SYSTEM AUDIT & ACTIVITY LOGS VIEW (Full table from GET /admin/audit-logs)
             ========================================================================= */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--ink)]">System Audit & Sign-in Logs</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Immutable security telemetry, user sign-in events, and administrative transition logs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {["all", "login", "register", "nudge", "complaint"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setAuditFilter(f)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                        auditFilter === f
                          ? "bg-[var(--ink)] text-white shadow-xs"
                          : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">Timestamp</th>
                      <th className="pb-3">Action Event</th>
                      <th className="pb-3">Actor / Email</th>
                      <th className="pb-3">Target Entity</th>
                      <th className="pb-3">Entity ID</th>
                      <th className="pb-3 text-right pr-2">Metadata Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                          No audit records found.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((a) => (
                        <tr key={a.id} className="hover:bg-[var(--paper)] transition-colors">
                          <td className="py-3.5 pl-2 font-mono text-[11px] text-[var(--muted)]">
                            {new Date(a.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                a.action.includes("login")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : a.action.includes("nudge")
                                  ? "bg-red-100 text-red-800"
                                  : a.action.includes("register")
                                  ? "bg-[var(--soft-blue)] text-[var(--blue-dark)]"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {a.action}
                            </span>
                          </td>
                          <td className="py-3.5 font-medium text-[var(--ink)]">
                            {a.actor_email || (a.user_id ? `User #${a.user_id}` : "System / Anonymous")}
                          </td>
                          <td className="py-3.5 font-mono text-[var(--muted)]">{a.entity_type}</td>
                          <td className="py-3.5 font-mono text-[var(--muted)] truncate max-w-32">{a.entity_id}</td>
                          <td className="py-3.5 pr-2 text-right">
                            <span className="font-mono text-[10px] text-[var(--muted)] bg-[var(--paper)] px-2 py-1 rounded-md border border-[var(--line)] inline-block truncate max-w-xs">
                              {a.meta_json ? JSON.stringify(a.meta_json) : "—"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── SLIDE-OVER ACTION TRAY DRAWER ────────────────────────────────────── */}
      {activeTray && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setActiveTray(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-[var(--line)] flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[var(--ink)] capitalize">
                  {activeTray === "students" && "Registered Student Profiles"}
                  {activeTray === "audit" && "Live System Audit Events"}
                  {activeTray === "overdue" && "Overdue Complaints Queue"}
                </h3>
                <p className="text-xs text-[var(--muted)]">Actionable governance drawer</p>
              </div>
              <button
                onClick={() => setActiveTray(null)}
                className="p-2 rounded-xl border border-[var(--line)] hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tray Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* TRAY: Students */}
              {activeTray === "students" && (
                <div className="space-y-3">
                  {studentProfiles.slice(0, 15).map((s) => (
                    <div key={s.id} className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--ink)]">{s.full_name}</span>
                        <span className="font-mono text-[10px] text-[var(--blue-dark)] font-bold">{s.prn_number}</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        <div>Dept: {s.department} · Div: {s.division} · Roll: {s.roll_no}</div>
                        <div>Email: {s.user_email}</div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setActiveTray(null);
                      setActiveTab("students");
                    }}
                    className="w-full py-2.5 bg-[var(--ink)] text-white text-xs font-bold rounded-xl mt-4"
                  >
                    View All {studentProfiles.length} Students
                  </button>
                </div>
              )}

              {/* TRAY: Audit Logs */}
              {activeTray === "audit" && (
                <div className="space-y-3">
                  {auditLogs.slice(0, 15).map((a) => (
                    <div key={a.id} className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--line)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-white text-[var(--blue-dark)] text-[10px] font-mono font-bold rounded-md border border-[var(--line)]">
                          {a.action}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)]">
                        {a.actor_email || `User #${a.user_id || "System"}`}
                      </div>
                      {a.meta_json && (
                        <p className="text-[10px] font-mono text-[var(--muted)] truncate">
                          {JSON.stringify(a.meta_json)}
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setActiveTray(null);
                      setActiveTab("audit");
                    }}
                    className="w-full py-2.5 bg-[var(--ink)] text-white text-xs font-bold rounded-xl mt-4"
                  >
                    View Full Audit History
                  </button>
                </div>
              )}

              {/* TRAY: Overdue Complaints */}
              {activeTray === "overdue" && (
                <div className="space-y-3">
                  {overdueComplaintsList.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[var(--muted)]">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      No complaints are currently overdue.
                    </div>
                  ) : (
                    overdueComplaintsList.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-red-50/50 border border-red-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-red-700">#{c.id.substring(0, 8)}</span>
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-full">
                            SLA Overdue
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[var(--ink)]">{c.title}</h4>
                        <div className="text-[10px] text-[var(--muted)]">Dept: {c.department} · Priority: {c.priority}</div>
                        <button
                          onClick={() => handleNudgeComplaint(c.id)}
                          className="w-full py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
                        >
                          Expedite Immediately
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
