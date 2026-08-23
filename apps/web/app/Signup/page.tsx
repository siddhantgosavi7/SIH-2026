"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("Create student account or sign in.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const endpoint = name ? "register" : "login";
    const body = name ? { email, name, password } : { email, password };
    const response = await fetch(`${apiBase}/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) return setNotice((await response.json()).detail ?? "Sign-in failed.");
    localStorage.setItem("resolve_access_token", (await response.json()).access_token);
    router.push("/");
  }

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="mark">↗</span> resolve</div></nav><section className="login-panel panel"><div className="eyebrow">Secure student access</div><h1>Track your concern.</h1><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Name <small>(required for registration)</small><input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Password<input type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="submit">{name ? "Create account" : "Sign in"}</button><div className="notice">{notice}</div></form></section></main>;
}
