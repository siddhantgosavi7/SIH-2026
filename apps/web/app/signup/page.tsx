"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Compass } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Registration failed. Email may already be registered.");
      }

      router.push("/login");
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed.");
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
          Create your account
        </h1>
        <p className="text-sm text-slate-500 font-medium mb-7">
          Join GIOP and start managing grievances
        </p>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-5 text-left">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. johndoe"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 text-sm font-medium text-[#0B0B12] placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4FFF] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email address Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
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
                placeholder="Min. 8 characters"
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

          {/* Primary Create Account Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3D4FFF] hover:bg-[#2b3dff] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3D4FFF] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md mt-2"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
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
          Already have an account?{" "}
          <Link href="/login" className="text-[#3D4FFF] font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
