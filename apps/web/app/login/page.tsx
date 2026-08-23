"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Compass } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        router.push("/");
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
          router.push("/");
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
          router.push("/");
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
      <div className="max-w-[440px] w-full bg-white rounded-[24px] p-8 sm:p-10 shadow-xl border border-black/5 text-center">
        {/* Top Circle Icon */}
        <div className="w-12 h-12 rounded-full bg-[#3D4FFF] flex items-center justify-center mx-auto mb-4 text-white shadow-md">
          <Compass className="w-6 h-6" />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl font-extrabold text-[#0B0B12] mb-1.5 tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 font-medium mb-7">
          Log in to your GIOP account
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                placeholder="Your username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm font-medium text-[#0B0B12] placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4FFF] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                placeholder="Your password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm font-medium text-[#0B0B12] placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4FFF] focus:border-transparent transition-all"
              />
            </div>
            {errorMessage && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 pl-1">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Primary Log In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3D4FFF] hover:bg-[#2b3dff] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3D4FFF] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md mt-2"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="px-3 text-xs text-slate-400 font-medium">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Bottom Link */}
        <p className="text-sm text-slate-500 font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#3D4FFF] font-bold hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </main>
  );
}
