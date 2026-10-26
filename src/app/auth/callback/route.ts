import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Older sign-in links land here. With a one-time code, swap it for a session cookie.
// Anything else goes on to /auth/finish; the browser keeps the "#..." part of the address
// through the redirect, so a session sent that way still arrives.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/";
  // Only allow same-site paths, never an outside address.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const finish = new URL("/auth/finish", url.origin);
  finish.searchParams.set("next", next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    finish.searchParams.set("error_code", "otp_expired");
  }
  for (const key of ["error_code", "error_description", "token_hash"]) {
    const v = url.searchParams.get(key);
    if (v) finish.searchParams.set(key, v);
  }
  return NextResponse.redirect(finish);
}
