import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";
import { normalizeMessageId, toRfcMessageId } from "@/app/_lib/email";

// Admin reply on an email-pipeline ticket. Stores the outbound message, then
// hands actual delivery to the ActivePieces "send" flow (its Gmail connection
// sends from the shared support address). Threading headers are set so the
// customer's mail client keeps the conversation in one thread.

const ADMIN_EMAIL = "admin@credly.com";

async function requireAdmin(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || data.user?.email !== ADMIN_EMAIL) return null;
  return supabase;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin(req);
  if (!supabase) return NextResponse.json({ error: "Admin access required." }, { status: 401 });

  const sendUrl = process.env.ACTIVEPIECES_SEND_WEBHOOK_URL;
  if (!sendUrl) {
    return NextResponse.json({ error: "ACTIVEPIECES_SEND_WEBHOOK_URL is not configured." }, { status: 500 });
  }

  const { id: ticketId } = await ctx.params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const replyText = String(body.body ?? "").trim();
  if (!replyText) return NextResponse.json({ error: "Reply text is required." }, { status: 400 });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, email, customer_email, company_id, description, last_inbound_message_id, status")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

  // Reply-To: the tagged support address (support+<tag>@…). The Gmail label
  // filter only labels tagged mail, so without this the customer's reply goes
  // to the bare address and never enters the pipeline. Needs SUPPORT_FROM_EMAIL
  // set to the real shared inbox address.
  let replyTo: string | null = null;
  const supportAddr = process.env.SUPPORT_FROM_EMAIL ?? "";
  if (supportAddr.includes("@") && ticket.company_id) {
    const { data: co } = await supabase
      .from("companies").select("routing_tag").eq("id", ticket.company_id).maybeSingle();
    if (co?.routing_tag) {
      const [local, domain] = supportAddr.split("@");
      replyTo = `${local}+${co.routing_tag}@${domain}`;
    }
  }

  const toEmail = ticket.customer_email || ticket.email;
  if (!toEmail) return NextResponse.json({ error: "Ticket has no customer email to reply to." }, { status: 400 });

  // Subject: latest inbound message's subject, else the ticket description's
  // "Subject:" first line. Prefix Re: unless it's already a reply subject.
  const { data: lastInbound } = await supabase
    .from("messages")
    .select("subject, email_message_id")
    .eq("ticket_id", ticketId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let subject = lastInbound?.subject
    ?? (ticket.description ?? "").split("\n")[0].replace(/^Subject:\s*/i, "").trim()
    ?? "";
  if (!subject) subject = "Your support request";
  if (!/^re:/i.test(subject)) subject = `Re: ${subject}`;

  const inReplyTo = ticket.last_inbound_message_id || lastInbound?.email_message_id || null;
  const fromEmail = process.env.SUPPORT_FROM_EMAIL ?? "support";

  // 1) Record the outbound message as a draft before attempting delivery.
  const { data: message, error: mErr } = await supabase
    .from("messages")
    .insert({
      ticket_id:   ticketId,
      direction:   "outbound",
      from_email:  fromEmail,
      to_email:    toEmail,
      subject,
      body_text:   replyText,
      in_reply_to: inReplyTo,
      status:      "draft",
    })
    .select("id")
    .single();
  if (mErr || !message) {
    return NextResponse.json({ error: `Could not store the reply: ${mErr?.message}` }, { status: 500 });
  }

  // 2) Hand off to the ActivePieces send flow.
  let sendOk = false;
  let sendErr = "";
  let returnedMessageId: string | null = null;
  try {
    const res = await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Message-IDs are stored bare; RFC 5322 headers need angle brackets.
      body: JSON.stringify({
        to: toEmail,
        subject,
        body: replyText,
        replyTo,
        inReplyTo: inReplyTo ? toRfcMessageId(inReplyTo) : null,
        references: inReplyTo ? toRfcMessageId(inReplyTo) : null,
      }),
    });
    sendOk = res.ok;
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      returnedMessageId = normalizeMessageId(json?.messageId);
    } else {
      sendErr = `Send flow responded ${res.status}`;
    }
  } catch (err) {
    sendErr = err instanceof Error ? err.message : "Send flow unreachable";
  }

  // 3) Mark the outcome.
  if (!sendOk) {
    await supabase.from("messages").update({ status: "failed" }).eq("id", message.id);
    return NextResponse.json({ error: `Reply was not sent: ${sendErr}`, messageId: message.id }, { status: 502 });
  }

  await supabase
    .from("messages")
    .update({ status: "sent", ...(returnedMessageId ? { email_message_id: returnedMessageId } : {}) })
    .eq("id", message.id);

  // Keep the legacy ticket fields in step (client portal + stats read these).
  // Replying marks the ticket answered — resolving is a separate manual action.
  await supabase.from("tickets").update({
    reply:      replyText,
    replied_at: new Date().toISOString(),
    status:     "answered",
  }).eq("id", ticketId);

  return NextResponse.json({ ok: true, messageId: message.id });
}
