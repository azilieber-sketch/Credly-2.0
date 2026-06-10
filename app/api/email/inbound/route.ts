import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";

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
//                         // tag often only appears here
// }

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

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) {
    // References header is a whitespace-separated list of Message-IDs
    return value.trim().split(/\s+/);
  }
  return [];
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
  const messageId  = typeof body.messageId === "string" && body.messageId.trim() ? body.messageId.trim() : null;
  const inReplyTo  = typeof body.inReplyTo === "string" && body.inReplyTo.trim() ? body.inReplyTo.trim() : null;
  const references = asArray(body.references);

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

  // ── Routing: plus-address tag first, sender-domain fallback ────────────────
  // On auto-forwarded mail the To header keeps the client's original support
  // address, so check deliveredTo too — that's where Gmail puts the real
  // recipient (with the +tag).
  const recipientAddresses = [...extractEmails(body.deliveredTo), ...extractEmails(toRaw)];
  let company: { id: string; name: string } | null = null;
  let routedBy: "tag" | "domain" | "none" = "none";

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
      .from("companies").select("id, name, email").like("email", `%@${domain}`).limit(1).maybeSingle();
    if (data) { company = data; routedBy = "domain"; }
  }

  // ── Threading: Message-ID refs → subject+sender fallback → new ticket ──────
  let ticketId: string | null = null;

  const threadIds = [inReplyTo, ...references].filter((v): v is string => !!v);
  if (threadIds.length) {
    const { data: parent } = await supabase
      .from("messages").select("ticket_id").in("email_message_id", threadIds).limit(1).maybeSingle();
    if (parent) ticketId = parent.ticket_id;
  }

  if (!ticketId && subject) {
    // Same customer replying on the same (normalized) subject to an open ticket.
    const { data: candidates } = await supabase
      .from("tickets")
      .select("id, description")
      .eq("customer_email", fromEmail)
      .in("status", ["open", "in-progress"])
      .order("created_at", { ascending: false })
      .limit(20);
    const wanted = normalizeSubject(subject);
    const match = candidates?.find((t) => {
      const firstLine = (t.description ?? "").split("\n")[0].replace(/^Subject:\s*/i, "");
      return normalizeSubject(firstLine) === wanted && wanted !== "";
    });
    if (match) ticketId = match.id;
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
    unassigned: !company,
  });
}
