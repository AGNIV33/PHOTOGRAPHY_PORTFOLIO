import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseKey, publicSupabaseUrl } from "./public-env";

export function createClient() {
  return createBrowserClient(publicSupabaseUrl, publicSupabaseKey);
}
