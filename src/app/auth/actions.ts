"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Sends the sign-in email from the server without a one-time "code verifier".
// The browser-made link only worked in the same browser that asked for it, so opening
// the email on a phone (or another browser) always failed. This link works anywhere.
export async function sendSignInLink(email: string, next: string): Promise<{ error: string | null }> {
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const finish = new URL("/auth/finish", origin);
  finish.searchParams.set("next", safeNext(next));

  const supabase = createPlainClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: finish.toString() },
  });
  return { error: error?.message ?? null };
}
