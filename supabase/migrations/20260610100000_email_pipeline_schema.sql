-- Email pipeline — Phase 1 schema foundation (all additive).
-- Shared forwarding pipe: clients forward support mail to support+<tag>@...;
-- the inbound webhook routes by tag, threads replies, and stores the full
-- conversation in `messages` (both directions — feeds future AI drafting).

-- 1. Per-company routing tag: lowercase slug, unique. Set on Add Client,
--    editable by admin. Nullable so existing rows are unaffected.
ALTER TABLE public.companies
  ADD COLUMN routing_tag text UNIQUE
  CHECK (routing_tag ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- 2. Per-ticket thread fields: who the customer is, and the RFC 5322
--    Message-ID of their latest inbound email (outbound replies set
--    In-Reply-To to this so the customer's mail client threads correctly).
ALTER TABLE public.tickets
  ADD COLUMN customer_email text,
  ADD COLUMN last_inbound_message_id text;

-- 3. Conversation history. ON DELETE CASCADE so deleting a ticket (as the
--    Delete Client flow does) takes its messages with it.
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  -- RFC 5322 Message-ID; the dedupe key for inbound webhook replays.
  -- (Postgres UNIQUE permits multiple NULLs, so outbound drafts are fine.)
  email_message_id text UNIQUE,
  in_reply_to text,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'draft', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_ticket_id_idx ON public.messages (ticket_id);

-- 4. RLS, matching the existing email-based pattern.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_messages ON public.messages
  FOR ALL USING (auth.email() = 'admin@credly.com');

CREATE POLICY companies_own_messages ON public.messages
  FOR SELECT USING (
    ticket_id IN (
      SELECT t.id
      FROM public.tickets t
      JOIN public.companies c ON c.id = t.company_id
      WHERE c.email = auth.email()
    )
  );
