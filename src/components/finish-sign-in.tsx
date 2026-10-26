"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PasswordField, FormMessage } from "@/components/auth/fields";
import { passwordProblem } from "@/lib/password";
import { createClient } from "@/lib/supabase/browser";

// Links in account emails land here.
// - mode=verified: the sign-up email. Supabase has already marked the email as verified;
//   we don't keep the session, the person signs in with their password.
// - mode=reset: the forgot-password email. The link signs in just long enough to choose
//   a new password, then signs out again.

type View = "working" | "verified" | "reset" | "saved" | "error";

function friendly(code: string | null, description: string | null) {
  if (code === "otp_expired" || /expired|invalid/i.test(description ?? "")) {
    return "This link has expired or was already used. Links work once, for one hour.";
  }
  return description || "This link didn't work.";
}

export function FinishSignIn() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const [view, setView] = useState<View>("working");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Keep tokens out of the address bar and history.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    const errCode = hash.get("error_code") ?? params.get("error_code");
    const errText = hash.get("error_description") ?? params.get("error_description");
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");

    (async () => {
      if (errCode || errText) {
        setError(friendly(errCode, errText));
        setView("error");
        return;
      }
      if (mode === "reset") {
        if (!access_token || !refresh_token) {
          setError(friendly("otp_expired", null));
          setView("error");
          return;
        }
        const { error } = await createClient().auth.setSession({ access_token, refresh_token });
        if (error) {
          setError(friendly(null, error.message));
          setView("error");
        } else {
          setView("reset");
        }
        return;
      }
      // Sign-up verification (and any older link): the email is verified; sign in next.
      setView("verified");
    })();
  }, [mode, params]);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) return setFormError(problem);
    if (password !== confirm) return setFormError("The two passwords are not the same.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setFormError(/different|same/i.test(error.message) ? "Please choose a password you haven't used before." : error.message);
      return;
    }
    await supabase.auth.signOut();
    setView("saved");
  }

  if (view === "reset") {
    return (
      <form className="auth-form" onSubmit={savePassword}>
        {formError && <FormMessage tone="error">{formError}</FormMessage>}
        <PasswordField label="New password" required autoComplete="new-password" maxLength={72} showStrength value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters, with letters and numbers." />
        <PasswordField label="Type it again" required autoComplete="new-password" maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="auth-row">
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </button>
        </div>
      </form>
    );
  }

  if (view === "verified" || view === "saved") {
    return (
      <div className="auth-sent" role="status">
        <p className="serif auth-sent-title">
          {view === "verified" ? "Your email is verified." : "Your new password is saved."}
          <span>Sign in with your email and password.</span>
        </p>
        <div className="auth-row">
          <Link href="/signin" className="btn btn-primary auth-submit">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="auth-sent" role="alert">
        <p className="serif auth-sent-title">{error}</p>
        <p className="auth-note">
          {mode === "reset"
            ? "Ask for a new link below."
            : "If you already verified your email, you can simply sign in. Otherwise sign in and we'll offer to send a new link."}
        </p>
        <div className="auth-row">
          <Link href={mode === "reset" ? "/forgot-password" : "/signin"} className="btn btn-primary auth-submit">
            {mode === "reset" ? "Get a new link" : "Go to sign in"}
          </Link>
        </div>
      </div>
    );
  }

  return <p className="label">One moment…</p>;
}
