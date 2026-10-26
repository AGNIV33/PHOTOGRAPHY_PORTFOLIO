"use client";

import { useEffect, useState } from "react";
import { resendVerification, signUp, type SignUpInput } from "@/app/auth/actions";
import { passwordProblem } from "@/lib/password";
import { COUNTRIES, INDIA_STATES } from "@/lib/places";
import { Field, FormMessage, PasswordField, SelectField } from "./fields";

const blank: SignUpInput = { first_name: "", last_name: "", phone: "", country: "India", state: "", email: "", password: "" };
const RESEND_WAIT = 60;

export function SignUpForm() {
  const [v, setV] = useState(blank);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; field?: keyof SignUpInput | "confirm" } | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [wait, setWait] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const put = (k: keyof SignUpInput, value: string) => {
    setV({ ...v, [k]: value, ...(k === "country" ? { state: "" } : {}) });
    if (error?.field === k) setError(null);
  };
  const set = (k: keyof SignUpInput) => (e: React.ChangeEvent<HTMLInputElement>) => put(k, e.target.value);
  const fieldError = (k: keyof SignUpInput | "confirm") => (error?.field === k ? error.text : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(v.password);
    if (problem) return setError({ text: problem, field: "password" });
    if (v.password !== confirm) return setError({ text: "The two passwords are not the same.", field: "confirm" });
    setBusy(true);
    setError(null);
    const res = await signUp(v);
    setBusy(false);
    if (res.error) return setError({ text: res.error, field: res.field });
    setSentTo(v.email.trim().toLowerCase());
    setWait(RESEND_WAIT);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sentTo) {
    return (
      <div className="auth-sent" role="status">
        <svg className="auth-sent-icon" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
          <rect x="6" y="13" width="44" height="30" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 14l22 17 22-17" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <p className="serif auth-sent-title">
          Check your email
          <span>{sentTo}</span>
        </p>
        <ol className="mail-steps">
          <li>
            <span className="frame-no">01</span>
            <span>Open the email from us and tap the link to verify your address.</span>
          </li>
          <li>
            <span className="frame-no">02</span>
            <span>Come back and sign in with your email and password.</span>
          </li>
        </ol>
        <p className="auth-note">
          Not there after a minute? Look in Spam or Promotions. If this email already has an account, no new email is sent; just sign in or reset your password.
        </p>
        {note && <p className="auth-note">{note}</p>}
        <div className="auth-row">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={wait > 0}
            onClick={async () => {
              setWait(RESEND_WAIT);
              const res = await resendVerification(sentTo);
              setNote(res.error ?? "Sent again.");
            }}
          >
            {wait > 0 ? `Send again in ${wait}s` : "Send the link again"}
          </button>
          <a href="/signin" className="auth-link">Go to sign in</a>
        </div>
      </div>
    );
  }

  const india = v.country === "India";

  return (
    <form onSubmit={onSubmit} className="auth-form">
      {error && !error.field && <FormMessage tone="error">{error.text}</FormMessage>}

      <fieldset className="auth-group">
        <legend className="frame-no">01 · About you</legend>
        <div className="auth-grid">
          <Field label="First name" required autoComplete="given-name" maxLength={60} value={v.first_name} onChange={set("first_name")} error={fieldError("first_name")} />
          <Field label="Last name" required autoComplete="family-name" maxLength={60} value={v.last_name} onChange={set("last_name")} error={fieldError("last_name")} />
          <Field
            label="Phone number"
            className="auth-span"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="+91 98765 43210"
            value={v.phone}
            onChange={set("phone")}
            error={fieldError("phone")}
            hint="Only the website's owners can see this."
          />
          <SelectField label="Country" options={COUNTRIES} placeholder="Choose a country" value={v.country} onChange={(x) => put("country", x)} error={fieldError("country")} />
          {india ? (
            <SelectField label="State" options={INDIA_STATES} placeholder="Choose a state" value={v.state} onChange={(x) => put("state", x)} error={fieldError("state")} />
          ) : (
            <Field label="State / region" required maxLength={80} autoComplete="address-level1" value={v.state} onChange={set("state")} error={fieldError("state")} />
          )}
        </div>
      </fieldset>

      <fieldset className="auth-group">
        <legend className="frame-no">02 · Your sign-in</legend>
        <Field label="Email" required type="email" inputMode="email" autoComplete="email" maxLength={200} placeholder="you@example.com" value={v.email} onChange={set("email")} error={fieldError("email")} />
        <PasswordField
          label="Password"
          required
          autoComplete="new-password"
          maxLength={72}
          showStrength
          value={v.password}
          onChange={set("password")}
          error={fieldError("password")}
          hint="At least 8 characters, with letters and numbers."
        />
        <PasswordField
          label="Type the password again"
          required
          autoComplete="new-password"
          maxLength={72}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (error?.field === "confirm") setError(null);
          }}
          error={fieldError("confirm")}
        />
      </fieldset>

      <div className="auth-row">
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </div>
      <p className="auth-note">We will send a link to your email to check that it is yours.</p>
    </form>
  );
}
