"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { getUser, isAdmin } from "@/lib/auth";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { passwordProblem } from "@/lib/password";
import { COUNTRIES } from "@/lib/places";

// Account emails are requested here on the server, without the one-time "code verifier"
// the browser flow needs, so their links work on any device or browser.

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

async function finishUrl(mode: "verified" | "reset") {
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const url = new URL("/auth/finish", origin);
  url.searchParams.set("mode", mode);
  return url.toString();
}

function emailClient() {
  return createPlainClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
  });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;

export type SignUpInput = {
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  state: string;
  email: string;
  password: string;
};

type Result = { error: string | null; field?: keyof SignUpInput };

export async function signUp(raw: SignUpInput): Promise<Result> {
  const t = (s: string | undefined, max: number) => (s ?? "").trim().replace(/\s+/g, " ").slice(0, max);
  const input = {
    first_name: t(raw.first_name, 60),
    last_name: t(raw.last_name, 60),
    phone: t(raw.phone, 20),
    country: t(raw.country, 60),
    state: t(raw.state, 80),
    email: t(raw.email, 200).toLowerCase(),
  };
  if (!input.first_name) return { error: "Please write your first name.", field: "first_name" };
  if (!input.last_name) return { error: "Please write your last name.", field: "last_name" };
  if (!PHONE.test(input.phone)) return { error: "Please write a phone number with only digits, spaces or +.", field: "phone" };
  if (!(COUNTRIES as readonly string[]).includes(input.country)) return { error: "Please choose your country.", field: "country" };
  if (!input.state) return { error: "Please write your state.", field: "state" };
  if (!EMAIL.test(input.email)) return { error: "That email address doesn't look right.", field: "email" };
  const problem = passwordProblem(raw.password ?? "");
  if (problem) return { error: problem, field: "password" };

  const { email, ...details } = input;
  const { error } = await emailClient().auth.signUp({
    email,
    password: raw.password,
    options: { data: details, emailRedirectTo: await finishUrl("verified") },
  });
  // If the email already has an account, Supabase answers as if it worked (so strangers
  // can't test which emails are registered). The page says the same either way.
  if (error) return { error: friendly(error.message) };
  return { error: null };
}

export async function resendVerification(email: string): Promise<Result> {
  const { error } = await emailClient().auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: await finishUrl("verified") },
  });
  return { error: error ? friendly(error.message) : null };
}

export async function requestPasswordReset(email: string): Promise<Result> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL.test(clean)) return { error: "That email address doesn't look right." };
  const { error } = await emailClient().auth.resetPasswordForEmail(clean, {
    redirectTo: await finishUrl("reset"),
  });
  return { error: error ? friendly(error.message) : null };
}

// After signing in: the two admins go to the dashboard, everyone else to the photos.
export async function pageAfterSignIn(next: string) {
  const user = await getUser();
  const wanted = safeNext(next);
  if (isAdmin(user)) return wanted.startsWith("/admin") ? wanted : "/admin";
  return wanted === "/" || wanted.startsWith("/admin") ? "/gallery" : wanted;
}

function friendly(message: string) {
  // Supabase lets one address ask for an email only once a minute.
  const wait = message.match(/after (\d+) seconds?/i);
  if (wait) return `Please wait ${wait[1]} seconds, then ask again. (An email can only be sent once a minute.)`;
  if (/rate|limit|too many/i.test(message)) {
    return "Too many emails were asked for. Please wait a few minutes, then try again.";
  }
  if (/database error/i.test(message)) return "Some details are missing or too long. Please check the form.";
  if (/password/i.test(message)) return message;
  return message || "Something went wrong. Please try again.";
}
