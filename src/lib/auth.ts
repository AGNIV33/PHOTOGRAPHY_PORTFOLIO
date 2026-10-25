import "server-only";
import type { User } from "@supabase/supabase-js";
import { adminEmails, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function isAdminEmail(email: string | undefined | null) {
  return Boolean(email && adminEmails().includes(email.toLowerCase()));
}

// Throws unless the signed-in user is on ADMIN_EMAILS. Every admin action calls this first.
export async function requireAdmin(): Promise<User> {
  const user = await getUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("Not allowed");
  return user;
}

export function displayName(user: User) {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name || meta?.name || (user.email ?? "Visitor").split("@")[0];
}
