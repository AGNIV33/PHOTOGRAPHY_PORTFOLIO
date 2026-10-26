import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseSecretKey, supabaseUrl } from "@/lib/env";

// Acts as the signed-in visitor (or anonymous). Row level security applies.
export async function createClient() {
  const cookieStore = await cookies();
  // Supabase reads the clock to check the session. Cookie data is part of the prefetched
  // shell, so tell Next.js real I/O follows before that happens.
  await io();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. proxy.ts refreshes them.
        }
      },
    },
  });
}

// Full access with the secret key. Only call after checking the user is an admin.
export function createAdminClient() {
  return createPlainClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
