"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

function Arrow() {
  return <span className="arrow">↗</span>;
}

const fields = [
  {
    number: "01",
    label: "Name",
    name: "name",
    type: "text",
    placeholder: "e.g. Firstname surname",
    autoComplete: "name",
  },
  {
    number: "02",
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "you@institution.edu",
    autoComplete: "email",
  },
  {
    number: "03",
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "At least 8 characters",
    autoComplete: "new-password",
  },
  {
    number: "04",
    label: "Confirm password",
    name: "confirmPassword",
    type: "password",
    placeholder: "Re-enter your password",
    autoComplete: "new-password",
  },
] as const;

type FormState = Record<(typeof fields)[number]["name"], string>;

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  function update(name: keyof FormState, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError(null);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name) {
      setError("Please enter your name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: form.password,
        }),
      });

      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const responseData = data as {
          detail?: string | Array<{ msg?: string }>;
          message?: string;
        } | null;

        let message = "Could not create your account.";

        if (typeof responseData?.detail === "string") {
          message = responseData.detail;
        } else if (Array.isArray(responseData?.detail)) {
          message = responseData.detail
            .map((item) => item?.msg)
            .filter(Boolean)
            .join(", ");
        } else if (responseData?.message) {
          message = responseData.message;
        }

        throw new Error(message);
      }

      const result = data as {
        access_token?: string;
      };

      /*
       * Your FastAPI /auth/register endpoint already returns
       * a TokenResponse containing access_token.
       */
      if (result?.access_token) {
        localStorage.setItem("token", result.access_token);

        localStorage.setItem(
          "session",
          JSON.stringify({
            access_token: result.access_token,
          })
        );
      }

      /*
       * Keep the signup -> login flow.
       *
       * Even though the backend gives us a token immediately,
       * the current GIOP UX intentionally takes the user to
       * the login page after account creation.
       */
      router.push("/login");
    } catch (error) {
      if (error instanceof TypeError) {
        setError(
          "Unable to connect to the GIOP server. Please make sure the backend is running."
        );
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`site ${styles.authPage}`}>
      <div className={styles.authGrid} />

      {/* NAVIGATION */}
      <header className="navbar">
        <a href="/" className="brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span>Resolve</span>
        </a>

        <div className="nav-actions">
          <span className={styles.navHint}>
            Already registered?
          </span>

          <a href="/login" className="nav-demo">
            Log in <Arrow />
          </a>
        </div>
      </header>

      {/* AUTH */}
      <section className={styles.authSection}>
        <div className={styles.authIntro}>
          <span className="section-kicker">
            <span
              className="eyebrow-dot"
              style={{ marginRight: 8 }}
            />

            Create account
          </span>

          <h1 className={styles.authHeading}>
            Start working with
            <br />
            grievance <em>intelligence.</em>
          </h1>

          <p className={styles.authDescription}>
            Create your Resolve account to submit, track and
            understand grievances across the institution.
          </p>
        </div>

        <form
          className={styles.authPanel}
          onSubmit={handleSubmit}
          noValidate
        >
          {fields.map((field) => (
            <div
              className={styles.formRow}
              key={field.name}
            >
              <div className={styles.formLabel}>
                <span className={styles.formNumber}>
                  {field.number}
                </span>

                <label htmlFor={field.name}>
                  {field.label}
                </label>
              </div>

              <input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                value={form[field.name]}
                onChange={(event) =>
                  update(field.name, event.target.value)
                }
                disabled={loading}
                required
                className={styles.formInput}
              />
            </div>
          ))}

          {error && (
            <p
              className={styles.formError}
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.formSubmit}
            disabled={loading}
          >
            <span>
              {loading
                ? "Creating account…"
                : "Create account"}
            </span>

            <Arrow />
          </button>

          <p className={styles.formFooterLink}>
            Already have an account?{" "}
            <a
              href="/login"
              className="text-link"
            >
              Log in
            </a>
          </p>
        </form>

        <div className={styles.authFooter}>
          <span>Resolve · SIH 2026</span>
        </div>
      </section>
    </main>
  );
}