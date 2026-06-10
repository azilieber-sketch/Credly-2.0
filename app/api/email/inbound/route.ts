import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";
import { normalizeMessageId, normalizeMessageIdList } from "@/app/_lib/email";

// Inbound email webhook — called by the ActivePieces "inbound" flow whenever
// the shared support inbox receives a mail. Routes the email to a company by
// plus-address tag (support+<tag>@…), threads it onto an existing ticket when
// possible, and stores it in `messages`. Safe to call twice with the same
// email (dedupe on the RFC 5322 Message-ID).
//
// Expected JSON payload (we define it; the ActivePieces flow maps Gmail
// trigger fields onto these keys):
// {
//   from: string,         to: string,            subject?: string,
//   text?: string,        html?: string,
//   messageId?: string,   inReplyTo?: string,
//   references?: string | string[],
//   deliveredTo?: string  // Delivered-To header — on auto-forwarded mail the
//                         // To header keeps the ORIGINAL address, so the plus
//                         // tag often only appears here. May arrive as the
//                         // full raw header line ("Delivered-To: x@y.com");
//                         // addresses are regex-extracted so that's fine.
// }
//
// ActivePieces quirks tolerated: Message-IDs may arrive with angle brackets
// (normalized to bare before store/compare); inReplyTo/references may be
// empty, missing, or an unresolved "{{template}}" literal (treated as not a
// reply); references may be a space-separated string or an array.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function extractEmails(field: unknown): string[] {
  if (typeof field !== "string") return [];
  return (field.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase());
}

// "support+acme@gmail.com" → "acme"
function extractPlusTag(address: string): string | null {
  const local = address.split("@")[0];
  const plus = local.indexOf("+");
  if (plus === -1) return null;
  const tag = local.slice(plus + 1).toLowerCase();
  return tag || null;
}

// "Re: Re: Fwd: Login broken" → "login broken" (for subject-based threading)
function normalizeSubject(subject: string): string {
  let s = subject.trim();
  for (;;) {
    const stripped = s.replace(/^(re|fwd?|fw)\s*:\s*/i, "");
    if (stripped === s) break;
    s = stripped;
  }
  return s.toLowerCase();
}

export async function POST(req: NextRequest) {
  // ── Auth: shared secret from the ActivePieces flow ─────────────────────────
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "EMAIL_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }
  const header = req.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fromEmail  = extractEmails(body.from)[0] ?? null;
  const toRaw      = typeof body.to === "string" ? body.to : "";
  const subject    = typeof body.subject === "string" ? body.subject : "";
  const bodyText   = typeof body.text === "string" ? body.text : "";
  const bodyHtml   = typeof body.html === "string" ? body.html : null;
  const messageId  = normalizeMessageId(body.messageId);
  const inReplyTo  = normalizeMessageId(body.inReplyTo);
  const references = normalizeMessageIdList(body.references);

  if (!fromEmail) {
    return NextResponse.json({ error: "Missing or unparseable 'from' address." }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // ── Dedupe: same Message-ID already stored → ack and stop ──────────────────
  if (messageId) {
    const { data: dupe } = await supabase
      .from("messages").select("id, ticket_id").eq("email_message_id", messageId).maybeSingle();
    if (dupe) {
      return NextResponse.json({ ok: true, deduped: true, ticketId: dupe.ticket_id });
    }
  }

  const recipientAddresses = [...extractEmails(body.deliveredTo), ...extractEmails(toRaw)];

  // ── Threading FIRST: a reply must append to its existing ticket before any
  // tag routing gets a chance to open a duplicate under the company. ─────────
  // NOTE: the ActivePieces Gmail send action can't set In-Reply-To/References
  // on outbound replies, so the customer's reply references a Message-ID we
  // never stored — the subject+sender fallback carries the load in practice.
  let ticketId: string | null = null;
  let routedBy: "thread" | "tag" | "domain" | "none" = "none";

  const threadIds = [inReplyTo, ...references].filter((v): v is string => !!v);
  if (threadIds.length) {
    const { data: parent } = await supabase
      .from("messages").select("ticket_id").in("email_message_id", threadIds).limit(1).maybeSingle();
    if (parent) ticketId = parent.ticket_id;
  }

  if (!ticketId && subject) {
    // Same customer (case-insensitive) replying on the same normalized
    // subject. Includes RESOLVED tickets — our own replies auto-resolve, so
    // the customer's next message usually targets a resolved ticket; it
    // appends and reopens rather than spawning a duplicate.
    const { data: candidates } = await supabase
      .from("tickets")
      .select("id, description, status")
      .ilike("customer_email", fromEmail)
      .order("created_at", { ascending: false })
      .limit(20);
    const wanted = normalizeSubject(subject);
    const matches = (candidates ?? []).filter((t) => {
      const firstLine = (t.description ?? "").split("\n")[0].replace(/^Subject:\s*/i, "");
      return normalizeSubject(firstLine) === wanted && wanted !== "";
    });
    // Prefer a still-active ticket; otherwise the most recent resolved one.
    const match = matches.find((t) => t.status !== "resolved") ?? matches[0];
    if (match) ticketId = match.id;
  }

  if (ticketId) routedBy = "thread";

  // ── Routing (new tickets only): plus-address tag, sender-domain fallback ───
  // On auto-forwarded mail the To header keeps the client's original support
  // address, so check deliveredTo too — that's where Gmail puts the real
  // recipient (with the +tag).
  let company: { id: string; name: string } | null = null;

  if (!ticketId) {
    for (const addr of recipientAddresses) {
      const tag = extractPlusTag(addr);
      if (!tag) continue;
      const { data } = await supabase
        .from("companies").select("id, name").eq("routing_tag", tag).maybeSingle();
      if (data) { company = data; routedBy = "tag"; break; }
    }

    if (!company) {
      // Fallback: a company whose login email shares the sender's domain.
      const domain = fromEmail.split("@")[1];
      const { data } = await supabase
        .from("companies").select("id, name, email").ilike("email", `%@${domain}`).limit(1).maybeSingle();
      if (data) { company = data; routedBy = "domain"; }
    }
  }

  let createdTicket = false;
  if (!ticketId) {
    const { data: ticket, error: tErr } = await supabase
      .from("tickets")
      .insert({
        company_id:     company?.id ?? null,
        company_name:   company?.name ?? "(unassigned)",
        email:          fromEmail,
        customer_email: fromEmail,
        issue_category: "general",
        priority:       "medium",
        description:    `Subject: ${subject || "(no subject)"}\n\n${bodyText}`.trim(),
        status:         "open",
        source:         "email",
      })
      .select("id")
      .single();
    if (tErr || !ticket) {
      return NextResponse.json({ error: `Could not create ticket: ${tErr?.message}` }, { status: 500 });
    }
    ticketId = ticket.id;
    createdTicket = true;
  }

  // ── Store the message ───────────────────────────────────────────────────────
  const { error: mErr } = await supabase.from("messages").insert({
    ticket_id:        ticketId,
    direction:        "inbound",
    from_email:       fromEmail,
    to_email:         recipientAddresses[0] ?? toRaw,
    subject:          subject || null,
    body_text:        bodyText || null,
    body_html:        bodyHtml,
    email_message_id: messageId,
    in_reply_to:      inReplyTo,
    status:           "received",
  });
  if (mErr) {
    // 23505 = unique violation on email_message_id: a concurrent duplicate
    // delivery won the race — that's a successful dedupe, not an error.
    if (mErr.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true, ticketId });
    }
    return NextResponse.json({ error: `Could not store message: ${mErr.message}` }, { status: 500 });
  }

  // ── Refresh the ticket's thread state ──────────────────────────────────────
  const ticketUpdate: Record<string, unknown> = { customer_email: fromEmail };
  if (messageId) ticketUpdate.last_inbound_message_id = messageId;
  await supabase.from("tickets").update(ticketUpdate).eq("id", ticketId);
  if (!createdTicket) {
    // A customer reply reopens a resolved ticket (but leaves in-progress alone).
    await supabase.from("tickets").update({ status: "open" }).eq("id", ticketId).eq("status", "resolved");
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    createdTicket,
    routedBy,
    unassigned: createdTicket && !company,
  });
}
