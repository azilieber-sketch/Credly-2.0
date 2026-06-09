@AGENTS.md

> **Session handoff:** read `PROGRESS.md` first — current state and the
> immediate priority (finish the Gmail integration).

# Credly — Project Context

Managed-service customer-support platform, **both sides**: an **admin support
center** (`/admin/*`) where staff answer tickets on behalf of client companies,
and a **client read-only reporting portal** (usage/reports/invoices/dashboard).
Credit-based model. (An earlier self-serve multi-tenant "workspace" pivot was
**reverted** — do not reintroduce workspace logic.)

**GitHub:** azilieber-sketch/Credly-2.0  
**Deploy:** Vercel project **"ticketflow"** → https://ticketflow-gules.vercel.app
(auto-deploys on push to `main`). **The repo is ALSO still git-connected to the
old "credly" Vercel project**, so every push to `main` double-deploys to both —
"credly" is NOT actually abandoned in Vercel yet. To stop this, disconnect or
delete the "credly" project in the Vercel dashboard (Settings → Git → Disconnect,
or delete the project). **MCP scope caveat:** the connected Vercel MCP token only
sees the team *"azilieber-6381's projects"* (`team_Yj0H6DStQ7Blwq6Yqq6YrJe5`),
which contains **only "credly"** — "ticketflow" is on a different account/team the
token can't reach (`get_project`/`get_deployment` for it return 404). So MCP
verification happens against "credly" as a mirror; to verify the real ticketflow
site, fetch https://ticketflow-gules.vercel.app directly or re-auth the Vercel MCP
to the account that owns ticketflow.

## Stack
- Next.js 16.2.4, React 19.2.4, Tailwind CSS v4, TypeScript
- App Router (`app/` directory), `"use client"` where needed
- Auth: **real Supabase Auth** (email/password + Google OAuth). `admin@credly.com`
  is the staff login.
- Data: **real Supabase Postgres** — `companies`, `tickets`, `integrations` with
  email-based RLS. Migrations tracked in `supabase/migrations/`.

## Architecture

```
app/
  _components/
    Sidebar.tsx           ← single shared sidebar, parameterized via NavItem[]
  (client)/               ← route group (no URL prefix)
    layout.tsx            ← auth guard + sidebar for /dashboard, /usage, etc.
    dashboard/page.tsx
    usage/page.tsx
    reports/page.tsx
    invoices/page.tsx
    settings/page.tsx
  admin/                  ← /admin prefix
    layout.tsx            ← admin auth guard + admin sidebar
    page.tsx              ← /admin dashboard
    companies/page.tsx
    credits/page.tsx
    usage/page.tsx
    reports/page.tsx
    invoices/page.tsx
    settings/page.tsx
  layout.tsx              ← root (html, body, fonts only)
  page.tsx                ← landing page
```

## Navigation
- **Client:** Dashboard · Usage · Reports · Invoices · Settings
- **Admin:** Dashboard · Companies · Credits · Usage · Reports · Invoices · Settings

## Key rules
1. Auth guard lives in `(client)/layout.tsx` and `admin/layout.tsx` only — never in pages
2. Sidebar is one component (`app/_components/Sidebar.tsx`) imported by both layouts
3. Active nav state uses `usePathname()` + exact match — no manual `setActiveNav` per page
4. Pages only export their content — sidebar/auth come from the layout
5. Import alias: `@/*` → `./` — use `@/app/_components/Sidebar`

## Deployment rule
After every change: `git add` → `git commit` → `git push` so Vercel deploys automatically. Never leave changes only on local disk.

## Landing page note
`app/page.tsx` still has "human-led AI support / helpdesk" positioning from an earlier concept. The product has since pivoted to usage/reporting/billing. This copy needs updating when we get to it.
