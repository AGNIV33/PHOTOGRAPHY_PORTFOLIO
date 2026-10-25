import "server-only";
import { getUser, isAdminEmail } from "@/lib/auth";
import { isBackendReady } from "@/lib/env";

export type AdminState = "not-configured" | "signed-out" | "not-admin" | "ok";

// Used by every admin page before loading anything private.
export async function adminState(): Promise<{ state: AdminState; email?: string }> {
  if (!isBackendReady) return { state: "not-configured" };
  const user = await getUser();
  if (!user) return { state: "signed-out" };
  if (!isAdminEmail(user.email)) return { state: "not-admin", email: user.email };
  return { state: "ok", email: user.email };
}
