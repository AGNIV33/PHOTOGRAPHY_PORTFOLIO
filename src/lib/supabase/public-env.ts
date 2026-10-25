// Browser-safe copies of the public Supabase settings (NEXT_PUBLIC_ values are inlined at build).
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export const publicSupabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  .replace(//rest/v1/?$/, "")
  .replace(//$/, "");
export const publicSupabaseKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
