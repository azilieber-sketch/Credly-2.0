// PARKED — direct Gmail OAuth integration (future premium feature).
// The live email pipeline is ActivePieces -> /api/email/inbound (see
// /api/tickets/[id]/reply for outbound). Do not delete without asking.
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";
import {
  GmailCredentials,
  getValidAccessToken,
  extractEmailBody,
  getHeader,
} from "@/app/_lib/gmail";

// Always return 200 — Pub/Sub treats non-2xx as a failure and retries indefinitely.
const ack = (note?: string) => NextResponse.json({ ok: true, note });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ack("invalid json");
  }

  // Pub/Sub push format: { message: { data: "<base64>", messageId, publishTime }, subscription }
  const messageData = (body as { message?: { data?: string } })?.message?.data;
  if (!messageData) return ack("no message data");

  let notification: { emailAddress?: string; historyId?: string | number };
  try {
    notification = JSON.parse(Buffer.from(messageData, "base64").toString("utf-8"));
  } catch {
    return ack("invalid notification payload");
  }

  const { emailAddress } = notification;
  if (!emailAddress) return ack("no emailAddress");

  const supabase = getServiceSupabase();

  // Find the integration whose connected Gmail matches this notification
  const { data: allIntegrations } = await supabase
    .from("integrations")
    .select("company_id, credentials")
    .eq("channel", "gmail")
    .eq("status", "connected");

  const integration = allIntegrations?.find(
    (i) => (i.credentials as GmailCredentials).email === emailAddress
  );

  if (!integration) return ack("unknown gmail account");

  const companyId   = integration.company_id as string;
  const credentials = integration.credentials as GmailCredentials;

  try {
    const accessToken = await getValidAccessToken(credentials, async (updated) => {
      await supabase.from("integrations").upsert(
        { company_id: companyId, channel: "gmail", status: "connected", credentials: updated },
        { onConflict: "company_id,channel" }
      );
    });

    // Use our stored historyId as startHistoryId to fetch only messages since last check
    const startHistoryId = credentials.history_id;
    if (!startHistoryId) return ack("no stored history_id — reconnect Gmail");

    const histRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded&labelId=INBOX`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 404 means our historyId is too old — advance it to the notification's value
    if (histRes.status === 404) {
      const freshId = notification.historyId ? String(notification.historyId) : startHistoryId;
      await supabase.from("integrations").upsert(
        {
          company_id: companyId,
          channel: "gmail",
          status: "connected",
          credentials: { ...credentials, history_id: freshId },
        },
        { onConflict: "company_id,channel" }
      );
      return ack("historyId expired, reset");
    }

    const histData = await histRes.json();
    const newHistoryId = histData.historyId ? String(histData.historyId) : startHistoryId;

    if (!histData.history?.length) {
      // No new inbox messages — still advance the stored historyId
      if (newHistoryId !== startHistoryId) {
        await supabase.from("integrations").upsert(
          {
            company_id: companyId,
            channel: "gmail",
            status: "connected",
            credentials: { ...credentials, history_id: newHistoryId },
          },
          { onConflict: "company_id,channel" }
        );
      }
      return ack("no new messages");
    }

    // Collect newly added message IDs
    const newMessageIds: string[] = (
      histData.history as Array<{
        messagesAdded?: Array<{ message: { id: string } }>;
      }>
    ).flatMap((h) => h.messagesAdded?.map((m) => m.message.id) ?? []);

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    for (const msgId of newMessageIds) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgRes.ok) continue;

      const msg     = await msgRes.json();
      const headers = (msg.payload?.headers ?? []) as Array<{ name: string; value: string }>;
      const from    = getHeader(headers, "From");
      const subject = getHeader(headers, "Subject") || "(no subject)";

      // Skip messages sent from the connected account itself
      if (from.includes(credentials.email)) continue;

      const senderEmail = from.match(/<(.+?)>/)?.[1] ?? from.trim();
      const bodyText    = extractEmailBody(msg.payload ?? {});
      const receivedAt  = new Date(parseInt(msg.internalDate)).toISOString();

      await supabase.from("tickets").insert({
        company_id:     companyId,
        company_name:   company?.name ?? "",
        email:          senderEmail,
        issue_category: "general",
        priority:       "medium",
        description:    `Subject: ${subject}\n\n${bodyText}`.trim(),
        status:         "new",
        source:         "gmail",
        created_at:     receivedAt,
      });
    }

    // Advance the stored historyId so the next notification doesn't reprocess these messages
    await supabase.from("integrations").upsert(
      {
        company_id: companyId,
        channel: "gmail",
        status: "connected",
        credentials: { ...credentials, history_id: newHistoryId },
      },
      { onConflict: "company_id,channel" }
    );
  } catch (err) {
    // Log but still return 200 — a persistent 500 would cause Pub/Sub to retry for 7 days
    console.error(`Gmail push error for ${emailAddress}:`, err);
  }

  return ack();
}
