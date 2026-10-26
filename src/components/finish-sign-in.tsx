"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

// The sign-in email lands here. Two kinds of link are handled:
// - Supabase's own email: the session arrives in the part of the address after "#".
// - Our email design: it carries a token_hash, used only when the button is pressed,
//   so email scanners that open links in advance can't use it up.

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function friendly(code: string | null, description: string | null) {
  if (code === "otp_expired" || /expired|invalid/i.test(description ?? "")) {
    return "This sign-in link has expired or was already used. Links work once, for one hour.";
  }
  return description || "This sign-in link didn't work.";
}

export function FinishSignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const tokenHash = params.get("token_hash");
  const [state, setState] = useState<"working" | "button" | "error">(tokenHash ? "button" : "working");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current || tokenHash) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    (async () => {
      const supabase = createClient();
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) {
          window.history.replaceState(null, "", window.location.pathname);
          router.replace(next);
          router.refresh();
          return;
        }
        setError(friendly(null, error.message));
      } else {
        // Already signed in (for example, the link was opened twice)? Then just continue.
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          router.replace(next);
          return;
        }
        setError(friendly(hash.get("error_code") ?? params.get("error_code"), hash.get("error_description") ?? params.get("error_description")));
      }
      setState("error");
    })();
  }, [next, params, router, tokenHash]);

  async function confirm() {
    setState("working");
    const { error } = await createClient().auth.verifyOtp({ token_hash: tokenHash!, type: "email" });
    if (error) {
      setError(friendly(null, error.message));
      setState("error");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (state === "button") {
    return (
      <div className="mail-sent">
        <span className="kicker">Almost there</span>
        <p className="serif text-[clamp(28px,3.4vw,40px)] leading-[1.08]">Tap the button to finish signing in.</p>
        <div>
          <button type="button" className="btn btn-primary" onClick={confirm}>
            Sign in →
          </button>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mail-sent" role="alert">
        <span className="kicker">Sign-in link</span>
        <p className="serif text-[clamp(28px,3.4vw,40px)] leading-[1.08]">{error}</p>
        <div>
          <Link href={`/signin?next=${encodeURIComponent(next)}`} className="btn btn-primary">
            Send a new link
          </Link>
        </div>
      </div>
    );
  }

  return <p className="label">Signing you in…</p>;
}
