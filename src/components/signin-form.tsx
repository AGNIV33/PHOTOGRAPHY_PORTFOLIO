"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pageAfterSignIn, resendVerification } from "@/app/auth/actions";
import { Field, FormMessage, PasswordField } from "@/components/auth/fields";
import { createClient } from "@/lib/supabase/browser";

// The one sign-in for everyone. The two admin emails land on the dashboard,
// everyone else on the photographs.
export function SignInForm({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setUnverified(false);
    setResent("");
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      if (/not confirmed/i.test(error.message)) {
        setUnverified(true);
      } else if (/rate|too many/i.test(error.message)) {
        setError("Too many tries. Please wait a few minutes, then try again.");
      } else {
        // Same words for a wrong email and a wrong password, so strangers learn nothing.
        setError("The email or password is not right.");
      }
      return;
    }
    router.replace(await pageAfterSignIn(next));
    router.refresh();
  }

  async function resend() {
    const { error } = await resendVerification(email);
    setResent(error ?? "A new verification link is on its way. Check your inbox and spam.");
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate={false}>
      {unverified && (
        <FormMessage tone="info">
          <p>Please verify your email first. Open the link we sent when you signed up.</p>
          {resent ? (
            <p>{resent}</p>
          ) : (
            <button type="button" className="auth-link" onClick={resend}>
              Send the verification link again
            </button>
          )}
        </FormMessage>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Field label="Email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <PasswordField label="Password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <div className="auth-row">
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link href="/forgot-password" className="auth-link">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
