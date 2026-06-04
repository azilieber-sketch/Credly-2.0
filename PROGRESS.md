# Credly — Progress & Session Handoff

_Last updated: 2026-06-04_

This file is the running context for the self-serve multi-tenant rebuild. Read it
first, then `CLAUDE.md` for architecture/conventions.

## Current state — built & working

**Multi-tenant foundation (DB)**
- `workspaces`, `workspace_members` (TEAMS model: owner/agent), `messages` tables.
- `tickets` + `integrations` carry `workspace_id`. `messages` is the threaded
  conversation per ticket.
- Membership-based RLS everywhere via `is_workspace_member(workspace_id)`
  (SECURITY DEFINER). `admin@credly.com` retains full staff access.
- Signup trigger `on_auth_user_created` → `handle_new_user` auto-creates a
  workspace + `owner` membership for every new user. **Verified working.**
- Migrations are tracked in `supabase/migrations/`.

**Product surface (one app, agent experience)**
- Auth: real Supabase Auth (email/password + Google). Landing page has working
  Sign Up + Sign In (Start Free → signup, Sign in → signin).
- Nav: **Dashboard · Inbox · Integrations · Brand Voice · Settings**. The old
  read-only client portal (usage/reports/invoices/dashboard-tickets) was removed.
- **Dashboard** — workspace-scoped real counts (open/total/resolved tickets,
  connected channels) + source donut. Empty state shows zeros.
- **Inbox** — workspace-scoped ticket list, source badges, realtime subscription
  filtered to `workspace_id`. Opening a ticket shows the message thread; the
  reply box **persists an agent message to `messages`** (fixes the old bug where
  replies wrote to non-existent columns and vanished). Best-effort Gmail send
  when `source==='gmail'`. Mark-resolved / reopen.
- **Integrations** panel — channel cards reading/writing `integrations` by
  `workspace_id`, real connection status. Gmail uses the REAL Google OAuth flow;
  Instagram/Slack/HubSpot are disabled "Soon". The old fake `{method:'oauth'}`
  connect path was removed (from the admin page too).
- **Brand Voice** panel — writes `workspaces.brand_voice` + `company_details`
  (jsonb: description/dos/donts). This is what future AI drafting will consume.
- **Settings** — edits `workspaces` name/industry/website/support_email.
- **UI polish** — app-wide interaction feedback via `@layer base` in
  `app/globals.css` (cursor pointer / not-allowed, subtle active press,
  focus-visible rings). New components inherit it.

**Verified this session (via Supabase MCP, as the real user under RLS):** all
three panels persist to the DB; reply → messages persists; cross-workspace
isolation holds (a user sees only their own workspace's data); signup trigger +
RLS intact. `next build` is clean.

## NOT done yet — immediate next step

**Wire up REAL Gmail connection so real emails become tickets.** The app code is
ready (OAuth routes are workspace-aware; push route sets `workspace_id` and
writes a customer message). What's missing is Google Cloud config:
1. In Google Cloud Console, create/confirm an OAuth 2.0 client and set
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in env (local `.env.local` does NOT
   have them yet; check Vercel prod too).
2. Register authorized redirect URIs for the callback on BOTH:
   - `http://localhost:3001/api/integrations/gmail/callback`
   - `https://<production-vercel-url>/api/integrations/gmail/callback`
3. Ensure the Pub/Sub topic + push subscription (`/api/integrations/gmail/push`)
   and the Gmail `watch` cron (`/api/integrations/gmail/watch`) are wired for prod.
4. Then: connect Gmail from the Integrations panel → send a test email → confirm
   a ticket + opening customer message appear in the workspace inbox.

## Known notes / gotchas

- **Email confirmation is currently OFF** in Supabase Auth (toggled off for
  throwaway-email testing). **Turn it back ON before real users.**
  (Auth → Providers → Email → Confirm email.)
- **~19 pre-existing lint errors** in old admin pages + one in
  `(client)/layout.tsx:97` — React-Compiler rules (`set-state-in-effect`,
  `purity`). **Non-blocking** (`next build` passes). New code is lint-clean.
- The old **`companies` table is kept but empty** of demo data. It's still
  referenced by legacy admin pages + transitional email-based RLS policies
  (`users_own_company`, `companies_own_tickets`). Retire it in a later clean step
  once the last email-based reads are migrated to `workspace_id`.
- `integrations.company_id` was made **nullable** so workspace-only integrations
  can exist (non-destructive).
- Admin surface at `/admin` is **internal staff tooling only** — do not build
  product features around it.
- Dev server for local testing runs on **port 3001** (`npm run dev -- -p 3001`),
  because 3000 is used by another project.
