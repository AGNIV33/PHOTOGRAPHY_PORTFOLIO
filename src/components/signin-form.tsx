"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignInForm({ next = "/" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect.toString() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <div className="grid gap-3 max-w-md" role="status">
        <span className="kicker">Check your email</span>
        <p className="serif text-[28px] leading-tight">
          We sent a sign-in link to {email}. Open it on this device to continue.
        </p>
        <button type="button" className="text-left text-[var(--ink-2)] underline" onClick={() => setState("idle")}>
          Use a different email
        </button>
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
