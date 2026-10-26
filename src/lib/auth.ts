import "server-only";
import type { User } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/config/admins";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function isAdminEmail(email: string | undefined | null) {
  return Boolean(email && (ADMIN_EMAILS as readonly string[]).includes(email.trim().toLowerCase()));
}

// An admin is one of the two emails, and that email must be verified.
export function isAdmin(user: User | null): boolean {
  return Boolean(user && user.email_confirmed_at && isAdminEmail(user.email));
}

// Throws unless the signed-in user is an admin. Every admin action calls this first.
export async function requireAdmin(): Promise<User> {
  const user = await getUser();
  if (!user || !isAdmin(user)) throw new Error("Not allowed");
  return user;
}

export function displayName(user: User) {
  const meta = user.user_metadata as { first_name?: string; last_name?: string; full_name?: string } | undefined;
  const full = [meta?.first_name, meta?.last_name].filter(Boolean).join(" ").trim();
  return (full || meta?.full_name || (user.email ?? "Visitor").split("@")[0]).slice(0, 80);
}
