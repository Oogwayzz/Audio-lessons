# Audio Lessons Library (private PWA)

This is a simple, private web app to store and play your ElevenLabs audio lessons.

## What it does (MVP)

- Email magic-link login (Supabase Auth)
- Upload audio (Supabase Storage) + create lesson metadata (Supabase Postgres)
- Browse by module and week
- Search lessons
- Bottom sticky player (play/pause, scrub, speed)
- Auto-saves progress every 10 seconds, resumes where you left off
- PWA-ready (manifest + service worker via next-pwa)

## What you need before running

- Node.js installed (LTS)
- A Supabase project (free tier is fine)
- Your repo checked out locally in VS Code

## 1) Create the Supabase backend

1. In Supabase, create a new project.
2. Go to **SQL Editor** and run the SQL in `supabase/schema.sql`.
3. Go to **Storage** and create a bucket called `audio`.
   - Set it to **Private**.
4. Go to **Authentication -> URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`

## 2) Configure environment variables

Create a file named `.env.local` at the project root (same level as `package.json`) and add:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

You find these in Supabase: **Project Settings -> API**.

## 3) Install and run

In a terminal, inside the project folder:

```
npm install
npm run dev
```

Then open:

- `http://localhost:3000`

## 4) Upload your first lesson

- Visit `http://localhost:3000/admin`
- Choose an MP3
- Fill in module name, week number, title, and optional tags
- Click Upload

The lesson will show up on the home page.

## 5) Deploy (optional)

Easiest is Vercel:

1. Create a Vercel account.
2. Import this GitHub repo.
3. Add the same environment variables in Vercel.
4. In Supabase Auth URL config:
   - Set Site URL to your Vercel domain
   - Add redirect URL: `https://YOUR_DOMAIN/auth/callback`

