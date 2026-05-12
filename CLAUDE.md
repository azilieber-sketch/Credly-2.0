@AGENTS.md

# Credly — Project Context

AI usage, reporting, and billing platform for client accounts. Credit-based model. Built as a concept/demo to show to stakeholders — no real backend, no real auth.

**GitHub:** azilieber-sketch/Credly-2.0  
**Deploy:** Vercel (auto-deploys on push to main)

## Stack
- Next.js 16.2.4, React 19.2.4, Tailwind CSS v4, TypeScript
- App Router (`app/` directory), `"use client"` where needed
- Auth: mock-only (localStorage `isLoggedIn` / `userEmail`)
- Data: all hardcoded or localStorage — no backend, no database

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
