"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Bell, RefreshCw, AlertTriangle, ArrowLeft, LogOut, CheckCircle2, Clock, Send, Eye } from "lucide-react";

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
  title: string;
  description: string;
  status: string;
  priority: string;
  sla_due_at: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const [overviews, setOverviews] = useState<DepartmentOverview[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [queue, setQueue] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudgeMsg, setNudgeMsg] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

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

    fetchData();
  }, [router]);

  async function fetchData() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(`${apiBase}/admin/departments/overview`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOverviews(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin overview:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchQueue(deptName: string | null) {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const url = deptName ? `${apiBase}/complaints?department=${encodeURIComponent(deptName)}` : `${apiBase}/complaints`;

    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (err) {
      console.error("Failed to fetch complaint queue:", err);
    }
  }

  function handleSelectDepartment(dept: string) {
    if (selectedDept === dept) {
      setSelectedDept(null);
      setQueue([]);
    } else {
      setSelectedDept(dept);
      fetchQueue(dept);
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
        body: JSON.stringify({ message: `ADMIN ESCALATION: Immediate review required for ${deptName} queue.` }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Urgent nudge sent to ${deptName} (${data.affected_complaints || 0} open complaints flagged)!`, "success");
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

  const totalComplaints = overviews.reduce((acc, curr) => acc + curr.total, 0);
  const totalOpen = overviews.reduce((acc, curr) => acc + curr.open, 0);
  const totalInProgress = overviews.reduce((acc, curr) => acc + curr.in_progress, 0);
  const totalOverdue = overviews.reduce((acc, curr) => acc + curr.overdue, 0);

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

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto flex items-center justify-between bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3948e8] flex items-center justify-center text-white font-bold shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-[#090909]">Admin Governance Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Cross-Department Accountability & Escalations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block px-3 py-1 bg-indigo-50 text-[#3948e8] text-xs font-bold rounded-lg border border-indigo-100">
            Role: Admin ({adminUser?.username || "administrator"})
          </span>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-600"
            title="Refresh statistics"
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
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Complaints</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalComplaints}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Across 10 Departments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Open Queue</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{totalOpen}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Awaiting Initial Action</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">In Progress</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">{totalInProgress}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Under Resolution</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">SLA Overdue</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1">{totalOverdue}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Requires Expedited Action</span>
          </div>
        </div>

        {/* Department Overview Grid */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Institutional Departments Overview</h2>
              <p className="text-xs text-slate-500">
                Click a department to drill down into its live complaint queue or issue an expedited nudge.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              10 Active Departments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {overviews.map((dept) => {
              const isSelected = selectedDept === dept.department;
              const hasOverdue = dept.overdue > 0;

              return (
                <div
                  key={dept.department}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-[#3948e8] bg-indigo-50/40 shadow-md ring-2 ring-[#3948e8]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-sm">{dept.department}</h3>
                      {hasOverdue && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {dept.overdue} overdue
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mb-4">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <strong className="text-slate-900">{dept.total}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Open:</span>
                        <strong className="text-amber-600">{dept.open}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>In Progress:</span>
                        <strong className="text-blue-600">{dept.in_progress}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved:</span>
                        <strong className="text-emerald-600">{dept.resolved}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleSelectDepartment(dept.department)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        isSelected
                          ? "bg-[#3948e8] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isSelected ? "Hide Queue" : "View Queue"}
                    </button>

                    <button
                      onClick={() => handleNudgeDepartment(dept.department)}
                      className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200"
                      title="Send urgent expedite notice to all staff in this department"
                    >
                      <Bell className="w-3.5 h-3.5 text-red-600" />
                      Nudge Dept
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Drill-Down Department Queue Section */}
        {selectedDept && (
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDept(null)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedDept} Department Live Queue
                  </h2>
                  <p className="text-xs text-slate-500">
                    {queue.length} active complaints in department queue
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleNudgeDepartment(selectedDept)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <Bell className="w-4 h-4" /> Expedite Whole Department Queue
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No active complaints in this department queue</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((c) => {
                  const isOverdue = new Date(c.sla_due_at) < new Date() && c.status !== "resolved" && c.status !== "closed";

                  return (
                    <div
                      key={c.id}
                      className={`p-5 rounded-xl border transition ${
                        isOverdue ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">{c.id.substring(0, 8)}...</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                c.status === "open"
                                  ? "bg-amber-100 text-amber-800"
                                  : c.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {c.status.replace("_", " ")}
                            </span>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-full">
                              Priority: {c.priority}
                            </span>
                            {isOverdue && (
                              <span className="px-2.5 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" /> SLA Overdue
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                          <div className="text-[11px] text-slate-400 pt-1">
                            Student ID: #{c.student_id} · Created: {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Nudge Control for this specific complaint */}
                        <div className="w-full md:w-72 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Flag / Expedite Request
                          </label>
                          <input
                            type="text"
                            placeholder="Optional custom message..."
                            value={nudgeMsg[c.id] || ""}
                            onChange={(e) => setNudgeMsg({ ...nudgeMsg, [c.id]: e.target.value })}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#3948e8]"
                          />
                          <button
                            onClick={() => handleNudgeComplaint(c.id)}
                            className="w-full py-2 bg-[#3948e8] hover:bg-[#2b37ca] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <Send className="w-3.5 h-3.5" /> Send Nudge to Staff
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
