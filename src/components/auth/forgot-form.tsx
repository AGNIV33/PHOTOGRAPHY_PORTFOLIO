"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/auth/actions";
import { Field, FormMessage } from "./fields";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <FormMessage tone="info">
        <p>If {email.trim()} has an account, a link to choose a new password is on its way.</p>
        <p>Open it on any device. It works once, for one hour. Check Spam if it doesn&apos;t arrive.</p>
      </FormMessage>
    );
  }

  return (
    <form
      className="auth-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await requestPasswordReset(email);
        setBusy(false);
        if (res.error) setError(res.error);
        else setSent(true);
      }}
    >
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Field label="Email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <div className="auth-row">
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? "Sending…" : "Email me a link"}
        </button>
      </div>
    </form>
  );
}
