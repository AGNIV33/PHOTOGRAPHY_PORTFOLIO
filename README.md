# PHOTOGRAPHY_PORTFOLIO

Street photography portfolio with a simple admin dashboard for the photographer.

Stack: Next.js (App Router) · Vercel · Supabase (data + sign-in) · Cloudinary (photos).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where things live

- `src/config/site.ts`: name, intro, menu and social links.
- `src/app/globals.css`: the design system ("contact sheet": Swiss grid, mono EXIF labels, one red accent).
- `src/components/`: header, footer, photo frame.
- `src/lib/placeholders.ts`: empty photo slots used until the admin dashboard is connected.

## Build phases

1. Setup (this commit): site shell, all pages, design system.
2. Admin: login, Add photo with auto camera details, albums.
3. Gallery: real photos, watermark, previews.
4. Members: visitor sign-in, locked photos, likes, comments.
5. Pages: journal, achievements, gear, about.
6. Polish: mobile, speed, download deterrents, guide for the photographer.
