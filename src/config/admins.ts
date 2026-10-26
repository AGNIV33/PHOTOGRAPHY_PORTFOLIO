// The only two accounts that can open the dashboard and change the website.
// supabase/accounts.sql has the same list (public.is_admin_email) for the database rules.
export const ADMIN_EMAILS = ["agniv333@gmail.com", "bumbarana.1111@gmail.com"] as const;
