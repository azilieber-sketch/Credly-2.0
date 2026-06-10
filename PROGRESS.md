# TicketFlow — Progress & Session Handoff

_Last updated: 2026-06-10_

Read this first, then `CLAUDE.md` for architecture/conventions.

> **Where we left off:** Email pipeline code is BUILT and the **inbound half
> is LIVE and tested end-to-end** (HEAD `5f4d502`). The ActivePieces inbound
> flow exists, its Test Step passed against production, and the webhook was
> self-tested live (tag routing, dedupe replay, threaded reply, unknown-tag →
> unassigned — all green; synthetic test tickets deleted afterward).
> **What remains:** the ActivePieces SEND flow (webhook trigger → Gmail send),
> putting its URL in `ACTIVEPIECES_SEND_WEBHOOK_URL` on Vercel ticketflow,
> then the spec's full end-to-end checklist with a real mailbox. Spec:
> `ticketflow-activepieces-email-pipeline-spec.md` (in Azi's Downloads).

## EMAIL PIPELINE — BUILT (2026-06-10); INBOUND LIVE, SEND FLOW PENDING

Locked architecture: ONE shared support inbox; each client forwards their
support email to `support+<routing_tag>@<shared>`; ActivePieces (verified
Gmail connector, free tier) is the middleware both directions. The direct
Gmail OAuth code is PARKED as a future premium feature (banner comments on
`app/api/integrations/gmail/*` + `app/_lib/gmail.ts`) — do not delete.

- ✅ **Schema** (migration `20260610100000_email_pipeline_schema`, applied):
  `companies.routing_tag` (unique lowercase slug, CHECK-enforced),
  `messages` table (both directions, `email_message_id` unique dedupe key,
  FK → tickets ON DELETE CASCADE, RLS admin-all + client read-own),
  `tickets.customer_email` + `tickets.last_inbound_message_id`.
- ✅ **Add Client** auto-generates a unique routing tag (shown + copyable on
  the success screen); tag is inline-editable on the company detail header.
- ✅ **Inbound** `POST /api/email/inbound` — `Authorization: Bearer
  EMAIL_WEBHOOK_SECRET`. Payload (we define it; AP maps Gmail fields):
  `{ from, to, subject, text, html, messageId, inReplyTo, references,
  deliveredTo }`. Routing: plus-tag from `deliveredTo` first (forwarded mail
  keeps the original To header!) then `to`; fallback sender-domain match;
  else unassigned ticket (`company_id` null, name "(unassigned)").
  Threading: In-Reply-To/References vs `messages.email_message_id`, then
  normalized-subject+sender on open tickets, else new ticket. Dedupes on
  Message-ID. Customer replies reopen resolved tickets. `source: "email"`.
- ✅ **Outbound** `POST /api/tickets/[id]/reply` (admin Bearer guard) —
  inserts `messages` row as draft → POSTs `{ to, subject, body, inReplyTo,
  references }` to `ACTIVEPIECES_SEND_WEBHOOK_URL` → marks sent/failed.
  Optional `SUPPORT_FROM_EMAIL` env var for the stored from-address.
  Admin conversation view renders the full `messages` thread for
  `source: "email"` tickets (failed/sending chips); legacy view for old ones.
- ✅ **Cleanup**: client-side fake Gmail connect removed — Gmail card in
  client Settings is now a "Managed by TicketFlow" Email card, app-password
  modal path gone.
- ✅ **ActivePieces field quirks hardened** (`5f4d502`, `app/_lib/email.ts`):
  Message-IDs normalized to BARE (no angle brackets) on every store/compare
  path; reply route re-adds `<>` for outgoing In-Reply-To/References;
  unresolved `{{template}}` literals / empty / missing `inReplyTo`+
  `references` treated as not-a-reply; `references` accepted as array or
  space-separated string; `deliveredTo` may be the raw header line
  ("Delivered-To: x@y.com") — addresses are regex-extracted.
- ✅ **Inbound LIVE + verified against production** (2026-06-10): webhook
  self-test passed all paths — plus-tag routing via `deliveredTo`, dedupe
  replay (`deduped:true`), threaded customer reply appends to the same
  ticket, unknown tag → unassigned. Test tickets cleaned up after.
- ✅ **ActivePieces inbound flow built by Azi; Test Step passed.** Gmail
  trigger field mapping: `from`/`to` from `message.from.value[0].address`
  (clean addresses), `deliveredTo` from `message.headerLines[0].line` (raw
  line), `messageId` arrives WITH angle brackets, `inReplyTo`/`references`
  from `message.inReplyTo`/`message.references`. A **Gmail label filter
  gates the trigger** so only labeled support mail enters the pipe (keeps
  noise/loops out of ticket creation).
- **Env vars:** `EMAIL_WEBHOOK_SECRET` set in local `.env.local` AND on
  Vercel ticketflow (verified: endpoint 401s without it).
  `ACTIVEPIECES_SEND_WEBHOOK_URL` doesn't exist yet (created with the AP
  "send" flow). Optional: `SUPPORT_FROM_EMAIL`.
- **Existing company "azi" was given routing tag `azi`** (predated the
  migration, so its tag was NULL; set via SQL).

### Update (2026-06-10, later): loop CONFIRMED end-to-end + status model rework
- ✅ Full loop verified live by Azi: inbound → ticket, admin reply → customer
  inbox (via AP send flow + Reply-To `support+<tag>@…`), customer reply →
  appends to the same ticket.
- ✅ **Echo guard:** Gmail labels whole conversations, so the AP trigger can
  re-emit our OWN outbound reply → it became a phantom 1-message ticket
  (looked like "conversation history disappeared" — the real thread was
  intact). Webhook now drops mail whose sender == `SUPPORT_FROM_EMAIL`;
  phantom ticket deleted.
- ✅ **New status model** (migration `20260610150000_ticket_status_model`,
  remapped open→new, in-progress→read): `new` → `read` (auto on admin open)
  → `answered` (auto on admin reply — **replying no longer resolves**) →
  `customer-replied` (auto on inbound append, from ANY status incl.
  resolved) → `resolved` (**manual Resolve button only**).
- ✅ Shared config `app/_lib/ticket-status.ts` (TICKET_STATUS_CFG +
  ATTENTION_STATUSES = new/read/customer-replied) replaces 5 duplicated
  per-page configs. **Urgency/priority UI removed everywhere** (filters,
  sorts, badges, dots, KPI tiles — replaced by status). The `priority`
  column was then DROPPED with Azi's approval (migration
  `20260610160000_drop_ticket_priority`); no code writes or reads it.
- ✅ Conversation threads (`messages`) now render in ALL ticket views:
  admin company detail, admin Global Inbox (also routes email replies via
  the reply endpoint now), and the client portal (read-only). Legacy
  description+reply view kept for pre-pipeline tickets.

### Remaining to go live (send half)
1. **Send flow in ActivePieces:** Webhook trigger → Gmail "Send Email"
   mapping to/subject/body + In-Reply-To/References from the webhook payload
   `{ to, subject, body, inReplyTo, references }` (IDs arrive WITH `<>`,
   ready for headers); put the flow's webhook URL in
   `ACTIVEPIECES_SEND_WEBHOOK_URL` on Vercel ticketflow → redeploy.
2. Run the spec's full end-to-end checklist with a real mailbox: email in →
   ticket under right company → admin reply lands threaded in the customer
   inbox → customer reply appends to the same ticket → client portal shows
   the thread read-only.
3. Remember the trigger is **polling (~5 min on free tier)** — inbound
   latency is expected; outbound is instant (webhook).
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
