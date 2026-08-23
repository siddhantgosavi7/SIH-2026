"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Users, Shield, LogOut } from "lucide-react";

interface AuditLog {
  id: number;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  event_metadata: Record<string, any>;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  username?: string;
  role: string;
  department?: string;
}

export default function AdminMyProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    const storedSession = JSON.parse(localStorage.getItem("session") || "null");

    if (!storedToken || !storedSession) {
      router.push("/login");
      return;
    }

    if (storedSession.role !== "admin") {
      router.push("/");
      return;
    }

    setToken(storedToken);
    setSession(storedSession);
    fetchData(storedToken);
  }, [router]);

  async function fetchData(authToken: string) {
    const headers = { Authorization: `Bearer ${authToken}` };

    // Fetch Audit Logs
    try {
      const res = await fetch(`${apiBase}/admin/audit-logs`, { headers });
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch {
      // Fallback
    }

    // Fetch Registered Users
    try {
      const res = await fetch(`${apiBase}/users`, { headers });
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    localStorage.clear();
    router.push("/");
  }

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-[#EEF1F5] flex items-center justify-center p-4">
        <p className="text-slate-500 font-medium">Loading GIOP Admin Workspace...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#EEF1F5] p-6 sm:p-10 font-sans">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-slate-300 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            Grievance Intelligence &amp; Orchestration
          </p>
          <h1 className="text-3xl font-extrabold text-[#0B0B12] tracking-tight">
            Central grievance control
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Hi, {session?.username || "admin"}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </header>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Left Card: System Audit & Sign-in Activity Logs */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <Activity className="w-6 h-6 text-teal-600 mb-2" />
          <h2 className="text-2xl font-bold text-[#0B0B12] mb-1">
            System Audit &amp; Sign-in Activity Logs
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Tracks user sign-ins, registrations, and administrative events.
          </p>

          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 flex-1">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => {
                const actorEmail =
                  log.event_metadata?.email ||
                  (log.event_metadata?.username ? `${log.event_metadata.username}` : `User #${log.actor_id || log.entity_id}`);
                const formattedTime = new Date(log.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <div
                    key={log.id}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-100/80"
                  >
                    <span className="font-bold text-sm text-[#0B0B12]">
                      {log.action} — {actorEmail}
                    </span>
                    <span className="text-xs text-slate-500">
                      Entity: {log.entity_type} · Time: {formattedTime}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Card: Registered Users */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <Users className="w-6 h-6 text-teal-600 mb-2" />
          <h2 className="text-2xl font-bold text-[#0B0B12] mb-1">
            Registered Users
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            List of all registered accounts in the system.
          </p>

          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 flex-1">
            {usersList.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No registered users found.</p>
            ) : (
              usersList.map((user) => (
                <div
                  key={user.id}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-100/80"
                >
                  <span className="font-bold text-sm text-[#0B0B12]">
                    {user.email}
                  </span>
                  <span className="text-xs text-slate-500">
                    Role: {user.role} {user.username ? `· Username: @${user.username}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
