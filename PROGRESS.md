# TicketFlow — Progress & Session Handoff

_Last updated: 2026-06-09 (evening)_

Read this first, then `CLAUDE.md` for architecture/conventions.

> **Where we left off (taking a break):** Admin can now fully onboard + remove
> clients, the admin area is access-guarded, clients can change their password,
> and a full interactive-UI sweep is done. All shipped to `main` (HEAD `b64c041`).
> **Next planned work:** the email pipeline build-out — see "NEXT BUILD PHASE"
> below (routing tag, `messages` table, thread IDs, brand voice). Gmail Step 2/3
> still pending too.
>
> **DB is safe across deploys:** verified nothing in build/deploy touches the
> database — no seed/migration runs on Vercel. `next build` is the only build
> step; migrations are applied manually via Supabase MCP/CLI. The DB is a
> separate hosted project, independent of deploys.

> **Model:** We are on the **managed-service** model (both sides: admin support
> center + client read-only portal). An earlier self-serve multi-tenant
> "workspace" pivot was **reverted** — do not reintroduce workspace logic.
>
> **Entry model:** Companies are **admin-provisioned only**. Prospects submit an
> inquiry via the landing-page "Talk to us" form; the admin follows up and
> creates the account manually. There is **no public self-signup** and **no
> pending-approval** flow anymore (both removed).

## Current state — working

**App / model**
- Managed-service, both sides intact:
  - **Admin support center** (`/admin/*`) — staff answer tickets on behalf of
    client companies; `admin@credly.com` is the staff login (email unchanged).
  - **Client read-only reporting portal** (`/dashboard`, `/usage`, `/reports`,
    `/invoices`, `/dashboard/tickets`, `/settings`).

**Branding — now TicketFlow**
- Rebranded from "Credly" → **TicketFlow** (commit `db4c7b5`).
- Logo at **`public/logo.png`** (transparent, 1086×383). Shown via `next/image`
  in: landing navbar + footer, the Sign-in & "Talk to us" modals, and the admin
  + client sidebars and mobile headers. (Source PNG from the user was actually
  opaque with a baked-in checkerboard; it was color-keyed/despeckled/cropped to
  real transparency.)
- Primary accent reskinned indigo/violet → logo blue **`#1B7FEE`** by remapping
  both Tailwind `indigo` and `violet` scales in `app/globals.css` (`@theme`,
  `600 = #1B7FEE`). Covers buttons/links/active states/highlights; gradients
  collapse to solid blue. A few hardcoded hex accents + `::selection` updated too.
- All "Credly" display text → "TicketFlow" (tab title, landing copy, admin label,
  client dashboard note, settings default). Emails (`admin@credly.com`,
  `support@credly.io`) left as-is.
- ⚠️ Favicon still the **Next.js default** — tab title updated, tab icon not yet.

**Deploy — IMPORTANT correction to earlier notes**
- Repo `azilieber-sketch/Credly-2.0`, branch `main`. Current HEAD: **`b64c041`**
  ("Fix client Settings toggle knob position"). All work below is pushed & live.
- The repo is git-connected to **TWO** Vercel projects, so every push to `main`
  **double-deploys**:
  - **ticketflow** → **https://ticketflow-gules.vercel.app** — the intended live
    site. Lives on a **different Vercel account/team** that the connected Vercel
    **MCP cannot see** (`get_project`/`get_deployment` for it return 404).
  - **credly** (aliases `credly2-0-p3fg.vercel.app`, etc.) — earlier notes called
    this "abandoned/broken," but it is **still git-connected and actively building
    every push** (it is the only project the MCP can see). It is NOT disconnected.
- **Verification workflow:** MCP deploy checks run against **credly** as a
  same-commit mirror; verify the real **ticketflow** site by fetching the URL
  directly (hard-refresh to beat CDN cache) or by re-authing the MCP to the
  account that owns ticketflow.
- **To stop the double-deploy:** disconnect/delete the **credly** project in the
  Vercel dashboard (Settings → Git → Disconnect, or delete the project).

**Auth / redirect config**
- Real **Supabase Auth** (email/password + Google OAuth). Redirect URLs for the
  ticketflow domain are configured in **both** Google Cloud (`/auth/callback` +
  `/api/integrations/gmail/callback`) and **Supabase Auth**.
- Landing modal is now **sign-in only** (existing clients). A signed-in user with
  no provisioned company sees a lightweight "no portal access" screen (no row is
  auto-created).
- ⚠️ Supabase **email confirmation is currently OFF** (for testing) — turn it
  back ON before real users.

**Supabase schema (clean managed-service)**
- Tables: `companies`, `tickets`, `integrations`, **`inquiries`** — email-based
  RLS (`users_own_company`, `companies_own_tickets`, `admin_all_*`).
- ✅ `tickets.reply` (text) + `tickets.replied_at` (timestamptz) **added** —
  replies and the "resolved" flip now persist (migration
  `20260609093951_add_ticket_reply_columns`, verified round-trip).
- ✅ **`inquiries`** table — `id, email, message (nullable), status
  ('new'|'contacted', default 'new'), created_at`. RLS: **anon INSERT** (pinned
  to `status='new'`) for the public form; **admin-only** SELECT/UPDATE (migration
  `20260609102331_create_inquiries`).
- ✅ Self-signup company-insert policy **dropped** (migration
  `20260609102332_remove_self_signup_company_insert`). `companies.status` still
  permits `pending` in the CHECK, but nothing writes it now — admin creates
  companies as **active**.
- Cron `/api/integrations/gmail/watch` is **daily** (`0 0 * * *`) for Hobby plan.
- **Current data (after test cleanup):** `companies` is **EMPTY**, and `auth.users`
  has **only `admin@credly.com`**. The earlier test clients (`credlytest1`,
  `Azilieber`/`azilieber@gmail.com`) were intentionally deleted. So "no clients
  showing in admin" right now is expected — create one via "+ Add client". (A
  prior "clients disappear on redeploy" worry was a login/RLS display thing, not
  data loss — deploys don't touch the DB.)

**Admin UX (this session)**
- Dashboard company rows are **fully clickable** → `/admin/companies/[id]`.
- **Approve-company / pending-approval flow removed** (UI + the approve action).
- **Inquiries** surfaced on the admin home (count badge + latest few, real-time)
  and as a sidebar nav item (lower in the list); full list at `/admin/inquiries`
  with mark-as-contacted.
- Note: `/admin/credits` and `/admin/activity` still render **legacy
  localStorage demo data** (IDs `"1".."8"`), so their rows are intentionally NOT
  linked to the Supabase company detail route (would 404). Migrate later.

**Client onboarding + admin security + UX (latest session — all shipped)**
- ✅ **Add Client** (`/admin/companies` → "+ Add client"): server route
  `app/api/admin/clients/route.ts` (POST) uses the **service role key** to create
  a confirmed Supabase Auth user + matching `companies` row (emails kept in sync
  so login links to the company), rolls back the auth user if the company insert
  fails, and marks the source inquiry contacted if launched via Inquiries →
  "Convert to client". UI shows the temp password once (generate/copy).
- ✅ **Delete Client** (company detail → Danger zone): same route (DELETE) removes
  tickets + integrations + company row + the Auth user (so they can't log in),
  behind a confirmation modal. Refuses to delete `admin@credly.com`.
- ✅ **Admin route guard** (`app/admin/layout.tsx`): only `admin@credly.com`
  renders `/admin/*`; signed-out → `/`, non-admin client → `/dashboard`. Sidebar
  shows the real session email + a Log out button (was hard-coded before).
- ✅ **Client change password** (`/settings` → Account → Password):
  `supabase.auth.updateUser({ password })`, 8-char min + match check.
- ✅ **UI sweep**: every page's interactive elements verified. Fixed the client
  Settings notification **toggle knob** (was 2px short of flush; now
  `translate-x-[18px]` + 200ms ease, matches admin).
- ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` is required** for Add/Delete Client. It's on
  the Vercel projects but **NOT in local `.env.local`** (only the anon key + URL
  are) — add it locally to test those flows on localhost.

## NEXT BUILD PHASE — EMAIL PIPELINE ARCHITECTURE (planned, from the Supabase audit)

Target: one shared inbound pipe → routed to the right client by **tag** →
**threaded** conversations → replies back to the right customer → data structured
for category dashboards + AI reply drafting (reads past convos + brand voice).
Audit found these **gaps to add/change** (propose migrations, review first):
1. **Per-client routing tag** on `companies` (unique, indexed) — e.g.
   `routing_tag`/`inbound_alias` so mail to `support+<tag>@…` maps to a client.
   Currently only `email` (login/contact) exists. *Decide:* shared inbox vs the
   current per-company Gmail-in-`integrations` model.
2. **`messages` table** (MISSING — removed in the workspace revert): `ticket_id`
   FK, `sender_type` (customer/agent/system), `body`, `created_at`,
   `provider_message_id`, `direction`. Today only a single `reply`/`replied_at`
   lives on `tickets` — no multi-turn thread for AI to read.
3. **Thread/reference IDs** on `tickets`: `thread_id` (Gmail threadId) +
   `rfc822_message_id`/`references` so customer replies match the same ticket and
   outbound replies thread correctly.
4. **Richer category model**: `issue_category` is locked to
   billing/technical/general — too coarse for dashboards. Expand or add `tags`.
5. **Brand voice / company profile** fields (on `companies` or a new table):
   `brand_voice`, `description`, `support_guidelines`, `signature` — feeds AI
   drafting. None exist yet.
6. Hygiene: RLS for the new `messages` table; consider `tickets.company_id` NOT
   NULL + `ON DELETE CASCADE`; indexes on routing_tag / company_id / status /
   thread_id / messages.ticket_id.

## NEXT SESSION — GMAIL INTEGRATION (priority)

Goal: end-to-end — a company connects Gmail → real emails become tickets →
agent replies from the admin inbox reach the customer. OAuth/push/reply routes
and `_lib/gmail.ts` are solid.

1. ✅ **DONE — DB Step 1:** `tickets.reply` + `tickets.replied_at` added (see
   above). Replies now persist.

2. **Remove the FAKE client-side Gmail connect** in
   `app/(client)/settings/page.tsx` (`handleConnect` + `ConnectModal`). It upserts
   manual modal credentials with no OAuth → a tokenless, broken Gmail integration.
   Managed service = **admin connects on the company's behalf** via the real OAuth
   flow at `/admin/companies/[id]` (`/api/integrations/gmail/auth?company_id=...`,
   already correct). Remove/disable the client self-connect for Gmail.
   - (Lower-priority: admin `handleIntConnect` `{method:'oauth'}` fake path at
     `app/admin/companies/[id]/page.tsx` only affects Slack/HubSpot/Instagram —
     mark those "Coming soon" eventually.)

3. **Config + live end-to-end test:**
   - Confirm all **6 env vars** on ticketflow: `GOOGLE_CLIENT_ID`,
     `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `CRON_SECRET`.
   - **Pub/Sub:** push subscription →
     **https://ticketflow-gules.vercel.app/api/integrations/gmail/push**. Topic
     `projects/spheric-algebra-497814-d9/topics/gmail-notifications` (in
     `callback/route.ts` + `watch/route.ts`); grant Publisher to
     `gmail-api-push@system.gserviceaccount.com`.
   - **Google consent screen:** add test Gmail addresses as **Test Users**
     (`gmail.readonly`/`gmail.send` are restricted → "unverified app" warning
     expected until Google verification).
   - **Test:** admin connects Gmail for a test company → email that inbox →
     ticket appears → reply from admin inbox → customer receives it AND the reply
     persists after refresh.
   - **DECIDED:** skip email **threading** this pass (reply is a fresh email).

## Also on the list (lower priority)

- **Disconnect/delete the "credly" Vercel project** to end the double-deploy
  (both ticketflow + credly still build every push).
- **Migrate legacy localStorage pages to Supabase:** `/admin/credits`,
  `/admin/activity`, `/admin/invoices` still show fake seed companies (IDs
  `"1".."8"`); on Invoices/Activity the company links **404** against the real
  DB. Needs a real migration (flagged in the UI sweep — not band-aided).
- Add a **favicon** from the ticket mark (tab title done, icon still Next default).
- Turn Supabase **email confirmation back ON** before real users; add **captcha**.
- Clean up the **pre-existing lint errors** in old admin pages (non-blocking;
  `next build` passes).

## Gmail pipeline status (reference)

- ✅ Real OAuth `auth` + `callback` (stores tokens, history_id, watch); admin
  Gmail "Connect" → real flow; token refresh; push→ticket creation; watch
  registration + daily renewal cron; Gmail **send** on reply; service-role client.
- ✅ `tickets.reply` / `tickets.replied_at` columns (Step 1 — done).
- ❌ Fake client-side Gmail connect still present (Step 2).
