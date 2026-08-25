"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

function Arrow() {
  return <span className={styles.arrow}>↗</span>;
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrorMessage("Please enter your username.");
      setIsSubmitting(false);
      return;
    }

    if (cleanUsername.includes("@")) {
      setErrorMessage(
        "Please enter your username, not an email address to log in."
      );
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("session", JSON.stringify(data));

        if (data.role === "admin") {
          router.push("/admin");
        } else if (
          data.role === "staff" ||
          data.role === "department_head"
        ) {
          router.push("/department");
        } else {
          router.push("/");
        }

        return;
      } else {
        const data = await res.json().catch(() => ({}));

        throw new Error(
          data.detail || "Invalid username or password"
        );
      }
    } catch (err: any) {
      /*
       * Keep the existing offline/demo fallback.
       * This only activates when the backend itself cannot be reached.
       */
      if (
        err.message === "Failed to fetch" ||
        err.message?.includes("fetch")
      ) {
        const isAdmin =
          cleanUsername === "admin" &&
          password === "admin@123";

        const isStaff = cleanUsername.includes("staff");

        const role = isAdmin
          ? "admin"
          : isStaff
          ? "staff"
          : "student";

        localStorage.setItem("token", "demo-offline-token");

        localStorage.setItem(
          "session",
          JSON.stringify({
            role,
            username: cleanUsername,
            department: isStaff ? "Hostel" : null,
          })
        );

        if (role === "admin") {
          router.push("/admin");
        } else if (role === "staff") {
          router.push("/department");
        } else {
          router.push("/");
        }

        return;
      }

      setErrorMessage(
        err.message || "Invalid username or password"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`site ${styles.loginPage}`}>
      {/* Subtle editorial background grid */}
      <div className={styles.loginGrid} />

      {/* NAVIGATION */}
      <header className="navbar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span>Resolve</span>
        </Link>

        <div className="nav-actions">
          <span className={styles.navHint}>
            New to Resolve?
          </span>

          <Link href="/signup" className="nav-demo">
            Create account <Arrow />
          </Link>
        </div>
      </header>

      {/* LOGIN CONTENT */}
      <section className={styles.loginSection}>
        {/* LEFT / INTRO */}
        <div className={styles.loginIntro}>
          <span className="section-kicker">
            <span
              className="eyebrow-dot"
              style={{ marginRight: 8 }}
            />

            Welcome back
          </span>

          <h1 className={styles.loginHeading}>
            Continue with
            <br />
            grievance <em>intelligence.</em>
          </h1>

          <p className={styles.loginDescription}>
            Log in to your Resolve account to submit, track
            and understand grievances across the institution.
          </p>

          <div className={styles.introMeta}>
            <span>Resolve · SIH 2026</span>
            <span className={styles.metaLine} />
            <span>Institutional grievance intelligence</span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form
          className={styles.loginPanel}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* USERNAME */}
          <div className={styles.formRow}>
            <div className={styles.formLabel}>
              <span className={styles.formNumber}>01</span>

              <label htmlFor="username">
                Username
              </label>
            </div>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="Your username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              disabled={isSubmitting}
              required
              className={styles.formInput}
            />
          </div>

          {/* PASSWORD */}
          <div className={styles.formRow}>
            <div className={styles.formLabel}>
              <span className={styles.formNumber}>02</span>

              <label htmlFor="password">
                Password
              </label>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              disabled={isSubmitting}
              required
              className={styles.formInput}
            />
          </div>

          {/* ERROR */}
          {errorMessage && (
            <p
              className={styles.formError}
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className={styles.formSubmit}
            disabled={isSubmitting}
          >
            <span>
              {isSubmitting
                ? "Logging in…"
                : "Log in"}
            </span>

            <Arrow />
          </button>

          {/* SIGNUP LINK */}
          <p className={styles.formFooterLink}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-link"
            >
              Create one
            </Link>
          </p>
        </form>
      </section>

      {/* BOTTOM FOOTER */}
      <footer className={styles.loginFooter}>
        <span>Resolve · SIH 2026</span>

        <span>
          Secure institutional access
        </span>
      </footer>
    </main>
  );
}