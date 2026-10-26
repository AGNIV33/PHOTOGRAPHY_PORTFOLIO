"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

// Supabase's free plan only sends a few emails an hour, so resending waits a minute.
const RESEND_WAIT = 60;

function friendlyError(message: string) {
  if (/rate|limit|seconds/i.test(message)) {
    return "Too many emails were asked for. Please wait a few minutes, then try again.";
  }
  if (/invalid/i.test(message) && /email/i.test(message)) return "That email address doesn't look right.";
  return message;
}

export function SignInForm({ next = "/" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [wait, setWait] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send() {
    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect.toString() },
    });
    return error;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const error = await send();
    if (error) {
      setState("error");
      setMessage(friendlyError(error.message));
    } else {
      setState("sent");
      setWait(RESEND_WAIT);
      setResent(false);
    }
  }

  async function resend() {
    setWait(RESEND_WAIT);
    const error = await send();
    if (error) {
      setMessage(friendlyError(error.message));
    } else {
      setMessage("");
      setResent(true);
    }
  }

  if (state === "sent") {
    return (
      <div className="mail-sent" role="status">
        <svg className="mail-sent-icon" width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
          <rect x="6" y="13" width="44" height="30" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 14l22 17 22-17" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <div className="grid gap-3">
          <span className="kicker">Check your email</span>
          <p className="serif text-[clamp(28px,3.4vw,40px)] leading-[1.08]">
            We sent a sign-in link to
            <span className="block text-[var(--safelight)] [overflow-wrap:anywhere]">{email.trim()}</span>
          </p>
        </div>
        <ol className="mail-steps">
          <li>
            <span className="frame-no">01</span>
            <span>Open the email we just sent, on this device.</span>
          </li>
          <li>
            <span className="frame-no">02</span>
            <span>
              Tap the <strong>Sign in</strong> button in it.
            </span>
          </li>
          <li>
            <span className="frame-no">03</span>
            <span>You come straight back here, signed in.</span>
          </li>
        </ol>
        <p className="text-[14px] text-[var(--ink-2)]">
          Not there after a minute? Look in Spam or Promotions. The link works once and expires after an hour.
        </p>
        {message && (
          <p className="text-[var(--safelight)]" role="alert">
            {message}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" className="btn btn-ghost btn-sm" onClick={resend} disabled={wait > 0}>
            {wait > 0 ? `Send again in ${wait}s` : "Send the link again"}
          </button>
          <button
            type="button"
            className="text-left text-[14px] text-[var(--ink-2)] underline hover:text-[var(--ink)]"
            onClick={() => {
              setState("idle");
              setMessage("");
            }}
          >
            Use a different email
          </button>
          {resent && wait > 0 && <span className="text-[14px] text-[var(--ink-2)]">Sent again.</span>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-md">
      <label className="grid gap-2">
        <span className="label">Email address</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="you@example.com"
        />
      </label>
      <button type="submit" className="btn btn-primary w-fit" disabled={state === "sending"}>
        {state === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </button>
      {state === "error" && (
        <p className="text-[var(--safelight)]" role="alert">
          {message}
        </p>
      )}
      <p className="text-[14px] text-[var(--muted)]">No password needed. The link signs you in.</p>
    </form>
  );
}
