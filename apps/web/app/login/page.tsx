"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // TEMP: hardcoded admin credential for demo — replace with real role-based auth before production
      if (email === "admin@gmail.com" && password === "admin@123") {
        localStorage.setItem(
          "session",
          JSON.stringify({ role: "admin", email })
        );
        router.push("/admin/dashboard");
        return;
      }

      // TODO: wire to real login API marker
      if (isRegistering) {
        const res = await fetch(`${apiBase}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Invalid email or password");
        }
        setIsRegistering(false);
        setErrorMessage("Account created. Please sign in.");
        setIsSubmitting(false);
        return;
      }

      // Try backend student login endpoint
      try {
        const res = await fetch(`${apiBase}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("session", JSON.stringify(data));
          router.push("/dashboard");
          return;
        }
      } catch {
        // Fallback for demo when backend is offline
        if (password.length >= 8) {
          localStorage.setItem("token", "demo-token");
          localStorage.setItem(
            "session",
            JSON.stringify({ role: "student", email })
          );
          router.push("/dashboard");
          return;
        }
      }

      setErrorMessage("Invalid email or password");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#DCEEF7] to-[#E4F5EE] flex items-center justify-center p-4">
      <div className="max-w-[480px] w-full bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-black/5 text-left">
        {/* Top-left Icon */}
        <LogIn className="w-7 h-7 text-black mb-4" />

        {/* Small bold tracked-out label */}
        <div className="text-[11px] font-extrabold tracking-wider text-[#0F6E82] uppercase mb-1">
          GRIEVANCE INTELLIGENCE &amp; ORCHESTRATION
        </div>

        {/* Large bold heading */}
        <h1 className="text-3xl font-extrabold text-[#0B0B12] mb-6">
          {isRegistering ? "Create student account" : "Sign in"}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-sm font-medium text-[#0B0B12] placeholder-gray-400 bg-[#FBFDFF] focus:outline-none focus:ring-2 focus:ring-[#0F6E82] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-sm font-medium text-[#0B0B12] placeholder-gray-400 bg-[#FBFDFF] focus:outline-none focus:ring-2 focus:ring-[#0F6E82] focus:border-transparent transition-all"
            />
            {/* Inline Error Message */}
            {errorMessage && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 pl-1">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Primary Sign in Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0F6E82] hover:bg-[#0c5969] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F6E82] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isSubmitting
              ? "Signing in..."
              : isRegistering
              ? "Create student account"
              : "Sign in"}
          </button>

          {/* Secondary Button */}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMessage("");
            }}
            className="w-full bg-[#EAEFEF] hover:bg-[#dfe5e5] text-[#0F6E82] font-semibold py-3 px-4 rounded-xl text-sm transition-colors text-center cursor-pointer"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "New student? Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
