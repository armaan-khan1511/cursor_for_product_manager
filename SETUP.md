# Setup guide — Supabase + Auth

The app now requires sign-in — every page redirects to `/login` until Supabase is configured, so this is no longer optional. Follow these in order.

## 0. Rotate your Gemini key (if you haven't already)
https://aistudio.google.com/apikey — delete the old one, make a new one, put it in `.env.local`.

## 1. Install the new dependency

```bash
npm install
```
This pulls in `@supabase/ssr`, which is new since the last build.

## 2. Create the Supabase project

1. https://supabase.com/dashboard → **New project**
2. Pick any name/region, set a database password (you won't need to remember it — you'll use API keys, not this password)
3. Wait ~2 minutes for it to finish provisioning

## 3. Get your keys

**Project Settings → API**, copy three values into `.env.local`:

| Supabase dashboard label | `.env.local` variable |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` |

## 4. Run the schema

**SQL Editor → New query** → paste the full contents of `supabase/schema.sql` → **Run**.

This creates `feedback_batches`, `analyses`, `specifications` — all with a `user_id` column and Row Level Security tied to `auth.uid()`.

## 5. Turn off email confirmation (important for a live demo)

By default Supabase makes new users click a confirmation link in their email before they can sign in — which will stall your demo waiting on an inbox.

**Authentication → Providers → Email** → turn **off** "Confirm email" → Save.

With this off, `signUp()` logs the user in immediately with no email step.

## 6. Restart and test

```bash
npm run dev
```

- Visit http://localhost:3000 → should redirect to `/login`
- Click "Need an account? Sign up", enter any email + a 6+ char password → should redirect straight into the dashboard
- Run the feedback → theme → spec flow once
- Check **Table Editor → analyses** in Supabase — you should see a row with your `user_id` on it
- Click **Sign out** in the dashboard header → should return to `/login`
- Sign up a *second* different email in an incognito window, confirm its data is separate (each user only ever sees their own session's data — there's no "view others' data" screen built, so this is really just confirming rows are tagged with the right `user_id` in the table editor)

## If something breaks

- **Redirect loop / can't reach dashboard**: double-check all three env vars are in `.env.local` with no extra quotes or spaces, then restart `npm run dev` (env changes need a restart).
- **"Sign in required" from the API even though you're logged in**: usually a stale session — sign out, sign back in.
- **Rows not appearing in Supabase**: confirm you ran the schema in step 4, and that `SUPABASE_SERVICE_ROLE_KEY` (not `anon`) is set — that's the one the API routes write with.

## Not built (say so if a judge asks)

- No password reset flow
- No "invite teammate to workspace" — each signup is its own isolated account, not a shared team workspace yet
- No UI to browse past analyses/specs — they're stored, but only the current session's live results are shown
