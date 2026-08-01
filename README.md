# SpecForge

AI-powered assistant that turns raw customer feedback into engineering-ready specifications.

Paste a batch of feedback → Gemini clusters it into prioritized themes → pick one → get a full spec (problem statement, acceptance criteria, technical tasks, edge cases) → export it in the format your coding agent or issue tracker expects.

See `docs/` for the product overview, architecture, and data flow.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000.

Supabase persistence is optional for local development — the app works end to end without it (analyses just won't be saved). See `SETUP.md` for the full walkthrough, including things you'll need to do outside this repo (creating accounts, getting keys, deploying).

## Project structure

```
src/
  app/
    page.tsx              dashboard UI
    api/
      analyze/route.ts       clusters feedback into themes
      generate-task/route.ts drafts a spec for a chosen theme
      export/route.ts        formats a spec for a target tool
  components/             FeedbackInput, ThemeList, SpecPanel, ExportPanel
  lib/
    gemini.ts             Gemini client + structured JSON helper
    prompts.ts             prompt templates + response schemas
    supabase.ts             server-side Supabase client
    types.ts                 shared types
supabase/schema.sql        Postgres schema + RLS policies
```
