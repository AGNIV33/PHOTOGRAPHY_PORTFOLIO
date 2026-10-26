# Setting up the backend (one time)

## 1. Supabase (database + sign-in)
1. supabase.com → New project (region: Mumbai).
2. **SQL Editor → New query** → paste everything from `supabase/schema.sql` → **Run**.
   (Already ran it earlier? Also run `supabase/content.sql`, then `supabase/link-previews.sql`, once each.)
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (change to the live Vercel address later)
   - Redirect URLs: add `http://localhost:3000/**` and `https://<your-site>.vercel.app/**` (both, or links from one place land on the other)
4. **Authentication → Email Templates** (optional, makes the sign-in email match the site).
   New free projects ignore custom templates until **Custom SMTP** is on
   (Authentication → Emails → SMTP Settings; e.g. Gmail: smtp.gmail.com, port 465, a Gmail App Password):
   see "Accounts" below for which template file goes where.
5. **Project Settings → API Keys**: copy Project URL, Publishable key, Secret key.

## Accounts (email + password)
- **SQL Editor**: run `supabase/accounts.sql` once (profiles table, admin rules).
- **Authentication → Sign In / Providers → Email**: *Confirm email* ON; minimum password length 8;
  password requirements "Letters and digits".
- **Authentication → Emails → SMTP Settings**: switch on Custom SMTP (sign-up emails are blocked
  to 2 an hour without it, and custom templates are ignored).
- **Email Templates**: paste `supabase/email-templates/confirm-signup.html` into *Confirm signup*
  and `reset-password.html` into *Reset Password* (subjects are written at the top of each file).
- Admins are fixed in `src/config/admins.ts` and `public.is_admin_email` in `accounts.sql`.

## 2. Cloudinary (photos)
Dashboard → copy Cloud name, API Key, API Secret.

## 3. Keys file
Copy `.env.example` to `.env.local` and fill every line. The admin emails are fixed in `src/config/admins.ts`.
Restart the site (`Ctrl+C`, then `npm run dev`).

## 4. Live site (Vercel)
Project → Settings → Environment Variables → add the same 7 values → Redeploy.
