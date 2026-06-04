@AGENTS.md

> **Session handoff:** read `PROGRESS.md` first — current state, the immediate
> next step (wire up real Gmail), and known gotchas.

# Credly — Project Context

Self-serve, multi-tenant customer-support SaaS. Any company signs up, gets its own isolated **workspace**, connects its support channels (Gmail, Instagram, Shopify, …), and its agents answer every incoming customer message from one **unified inbox** — the customer replying on whatever channel they originally used. AI tone-learning comes later.

> Pivoted from an earlier managed-service model (a Credly admin answered tickets for read-only client companies). That admin surface still exists at `/admin` as **internal staff tooling only** — do not build product features around it.

**GitHub:** azilieber-sketch/Credly-2.0  
**Deploy:** Vercel (auto-deploys on push to main)

## Stack
- Next.js 16.2.4, React 19.2.4, Tailwind CSS v4, TypeScript
- App Router (`app/` directory), `"use client"` where needed
- **Auth: real Supabase Auth** (email/password + Google OAuth). `admin@credly.com` is the internal staff login.
- **Data: real Supabase Postgres** with membership-based RLS. (Some legacy admin pages still read localStorage seed data — being retired.)

## Multi-tenancy
- A **workspace** is the tenant boundary. `workspace_members` links `auth.users` → workspace with a role (`owner` | `agent`).
- A signup trigger (`on_auth_user_created` → `handle_new_user`) auto-creates a workspace + `owner` membership for every new user, so signup immediately yields an isolated space.
- `tickets`, `integrations`, and `messages` carry a `workspace_id`. RLS scopes access via `is_workspace_member(workspace_id)` (SECURITY DEFINER helper). `admin@credly.com` retains full access.
- Current simplification: **one workspace per user** (resolved in `app/_lib/workspace.ts`). A workspace switcher can come later.
- The legacy `companies` table is still present (empty of demo data) and retired in a later step — do not build on it.

## Data model (Supabase)
- `workspaces` — tenant (name, brand_voice + company-detail placeholders)
- `workspace_members` — (workspace_id, user_id, role), unique per pair
- `tickets` — one per customer conversation (has `workspace_id`, `source`, `status`)
- `messages` — threaded conversation per ticket (`ticket_id`, `workspace_id`, `sender_type` customer|agent, body, channel)
- `integrations` — connected channels per workspace
- Migrations live in `supabase/migrations/` (tracked).

## Architecture

```
app/
  _lib/
    supabase.ts            ← browser client (anon key + user session)
    supabase-server.ts     ← service-role client for API routes (bypasses RLS)
    workspace.ts           ← getCurrentWorkspace() — resolves tenant via membership
  _components/
    Sidebar.tsx            ← single shared sidebar, parameterized via NavItem[]
  (client)/                ← THE product surface (route group, no URL prefix)
    layout.tsx             ← auth guard + sidebar; redirects admin@credly.com → /admin
    dashboard/page.tsx     ← workspace overview (real counts)
    inbox/page.tsx         ← unified inbox: tickets + message threads + reply
    settings/page.tsx      ← placeholder (channels/brand voice/team — later)
  admin/                   ← /admin — INTERNAL STAFF ONLY (background, not the product)
  api/integrations/gmail/  ← OAuth, Pub/Sub push (creates tickets+messages), reply, watch
  layout.tsx               ← root (html, body, fonts only)
  page.tsx                 ← landing page
```

## Navigation
- **Product (agent):** Dashboard · Inbox · Settings
- **Admin (staff only):** Dashboard · Companies · Credits · Usage · Reports · Invoices · Settings

## Key rules
1. Auth guard lives in `(client)/layout.tsx` and `admin/layout.tsx` only — never in pages
2. Sidebar is one component (`app/_components/Sidebar.tsx`) imported by both layouts
3. Active nav state uses `usePathname()` + exact match — no manual `setActiveNav` per page
4. Pages only export their content — sidebar/auth come from the layout
5. Import alias: `@/*` → `./` — use `@/app/_components/Sidebar`
6. Scope all tenant data by the current user's **workspace membership**, never by `email = auth.email()`. Resolve the workspace via `getCurrentWorkspace()`.

## Deployment rule
After every change: `git add` → `git commit` → `git push` so Vercel deploys automatically. Never leave changes only on local disk.

## Landing page note
`app/page.tsx` still has "human-led AI support / helpdesk" positioning from an earlier concept. The product has since pivoted to usage/reporting/billing. This copy needs updating when we get to it.
