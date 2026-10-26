# Setting up the backend (one time)

## 1. Supabase (database + sign-in)
1. supabase.com → New project (region: Mumbai).
2. **SQL Editor → New query** → paste everything from `supabase/schema.sql` → **Run**.
   (Already ran it before the Journal/achievements/gear editor existed? Run `supabase/content.sql` once too.)
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (change to the live Vercel address later)
   - Redirect URLs: add `http://localhost:3000/**` (and later `https://<your-site>.vercel.app/**`)
4. **Project Settings → API Keys**: copy Project URL, Publishable key, Secret key.

## 2. Cloudinary (photos)
Dashboard → copy Cloud name, API Key, API Secret.

## 3. Keys file
Copy `.env.example` to `.env.local` and fill every line. `ADMIN_EMAILS` = the photographer's email.
Restart the site (`Ctrl+C`, then `npm run dev`).

## 4. Live site (Vercel)
Project → Settings → Environment Variables → add the same 7 values → Redeploy.
