"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Bell, RefreshCw, AlertTriangle, LogOut, CheckCircle2, Clock, PlayCircle, CheckCircle } from "lucide-react";

interface QueueStats {
  department: string;
  open: number;
  in_progress: number;
  escalated: number;
  resolved: number;
}

interface Complaint {
  id: string;
  student_id: number;
  department: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  sla_due_at: string;
  created_at: string;
}

interface NotificationItem {
  id: number;
  complaint_id: string | null;
  channel: string;
  subject: string;
  body: string;
  created_at: string;
}

export default function DepartmentDashboard() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [queue, setQueue] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const sessionStr = localStorage.getItem("session");
    if (!token || !sessionStr) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(sessionStr);
      if (parsed.role !== "staff" && parsed.role !== "department_head" && parsed.role !== "admin") {
        router.push("/");
        return;
      }
      setSession(parsed);
    } catch {
      router.push("/login");
      return;
    }

    fetchDepartmentData();
  }, [router]);

  async function fetchDepartmentData() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch Department Stats
      const statsRes = await fetch(`${apiBase}/dashboard/department`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Live Department Complaints Queue
      const queueRes = await fetch(`${apiBase}/complaints`, { headers });
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setQueue(queueData);
      }

      // 3. Fetch Notifications / Admin Nudges
      const notifRes = await fetch(`${apiBase}/notifications`, { headers });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (err) {
      console.error("Failed to load department dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransition(complaintId: string, nextStatus: "in_progress" | "resolved") {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase}/complaints/${complaintId}/transition`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus, note: `Status updated by ${session?.username || "staff"}` }),
      });

      if (res.ok) {
        showToast(`Complaint moved to ${nextStatus.replace("_", " ")}`, "success");
        fetchDepartmentData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || "Failed to update complaint status", "error");
      }
    } catch {
      showToast("Error updating status", "error");
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

  // Filter urgent admin nudges
  const adminNudges = notifications.filter(
    (n) => n.channel === "nudge" || n.subject.includes("NUDGE") || n.subject.includes("URGENT")
  );

  const deptName = session?.department || stats?.department || "Department";

  return (
    <main className="min-h-screen bg-[#F5F5F2] text-[#090909] p-4 sm:p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-xl font-medium text-sm flex items-center gap-2.5 text-white animate-bounce ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Navigation Topbar */}
      <header className="max-w-7xl mx-auto flex items-center justify-between bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3948e8] flex items-center justify-center text-white font-bold shadow-md">
            ↗
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-[#090909]">
              {deptName} Staff Operations
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Live Priority Queue & Resolution Workflow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block px-3 py-1 bg-blue-50 text-[#3948e8] text-xs font-bold rounded-lg border border-blue-100">
            {session?.username || "Officer"} ({deptName})
          </span>
          <button
            onClick={fetchDepartmentData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-600"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Nudges / Flagged Urgent Notices Banner */}
        {adminNudges.length > 0 && (
          <section className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm uppercase tracking-wide">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
              <span>Urgent Admin Escalation Notices ({adminNudges.length})</span>
            </div>
            <div className="space-y-2">
              {adminNudges.map((nudge) => (
                <div key={nudge.id} className="bg-white p-3.5 rounded-xl border border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-red-700">{nudge.subject}</span>
                    <p className="text-xs text-slate-700">{nudge.body}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 self-end sm:self-center font-mono">
                    {new Date(nudge.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hero Section & Service Level Cards */}
        <section className="hero department-hero bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full mb-3">
              ACCOUNTABILITY WORKSPACE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Resolve highest impact first.
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-xl mt-1">
              Priority, SLA risks, student count, and administrative audit trails in one live queue.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-1/2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block">Open Queue</span>
              <span className="text-2xl font-extrabold text-amber-600">{stats?.open ?? 0}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block">In Progress</span>
              <span className="text-2xl font-extrabold text-blue-600">{stats?.in_progress ?? 0}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block">Escalated</span>
              <span className="text-2xl font-extrabold text-red-600">{stats?.escalated ?? 0}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block">Resolved</span>
              <span className="text-2xl font-extrabold text-emerald-600">{stats?.resolved ?? 0}</span>
            </div>
          </div>
        </section>

        {/* Live Complaint Queue */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Priority Queue ({queue.length})</h2>
              <p className="text-xs text-slate-500">Live API-backed grievances for {deptName}</p>
            </div>
            <span className="px-3 py-1 bg-[#soft-blue] text-[#3948e8] font-bold text-xs rounded-full border border-[#3948e8]/20">
              {deptName.toUpperCase()} QUEUE
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No pending complaints in {deptName} queue!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => {
                const isOverdue = new Date(item.sla_due_at) < new Date() && item.status !== "resolved" && item.status !== "closed";
                const hasNudge = adminNudges.some((n) => n.complaint_id === item.id);

                return (
                  <article
                    key={item.id}
                    className={`p-5 rounded-xl border transition-all ${
                      hasNudge
                        ? "border-red-400 bg-red-50/40 shadow-sm ring-1 ring-red-400/30"
                        : isOverdue
                        ? "border-amber-300 bg-amber-50/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{item.id.substring(0, 8)}...</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              item.status === "open"
                                ? "bg-amber-100 text-amber-800"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-full">
                            Priority: {item.priority}
                          </span>
                          {hasNudge && (
                            <span className="px-2.5 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                              <Bell className="w-3 h-3" /> ADMIN NUDGED
                            </span>
                          )}
                          {isOverdue && !hasNudge && (
                            <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> SLA Overdue
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                        <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3">
                          <span>Student ID: #{item.student_id}</span>
                          <span>Category: {item.category}</span>
                          <span>Filed: {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center gap-2 self-start md:self-center">
                        {item.status === "open" && (
                          <button
                            onClick={() => handleTransition(item.id, "in_progress")}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                          >
                            <PlayCircle className="w-4 h-4" /> Start Resolution
                          </button>
                        )}
                        {item.status === "in_progress" && (
                          <button
                            onClick={() => handleTransition(item.id, "resolved")}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                          >
                            <CheckCircle className="w-4 h-4" /> Mark Resolved
                          </button>
                        )}
                        {item.status === "resolved" && (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
