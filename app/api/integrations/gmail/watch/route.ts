import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";
import {
  GmailCredentials,
  getValidAccessToken,
  extractEmailBody,
  getHeader,
} from "@/app/_lib/gmail";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: integrations } = await supabase
    .from("integrations")
    .select("company_id, credentials")
    .eq("channel", "gmail")
    .eq("status", "connected");

  if (!integrations?.length) return NextResponse.json({ processed: 0 });

  let totalCreated = 0;

  for (const integration of integrations) {
    const companyId  = integration.company_id as string;
    const credentials = integration.credentials as GmailCredentials;

    try {
      if (!credentials.history_id) continue;

      const accessToken = await getValidAccessToken(credentials, async (updated) => {
        await supabase.from("integrations").upsert(
          { company_id: companyId, channel: "gmail", status: "connected", credentials: updated },
          { onConflict: "company_id,channel" }
        );
      });

      // Fetch Gmail history since last check
      const histRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${credentials.history_id}&historyTypes=messageAdded&labelId=INBOX`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // historyId expired — grab a fresh one and skip this cycle
      if (histRes.status === 404) {
        const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await profileRes.json();
        await supabase.from("integrations").upsert(
          {
            company_id: companyId,
            channel: "gmail",
            status: "connected",
            credentials: { ...credentials, history_id: String(profile.historyId) },
          },
          { onConflict: "company_id,channel" }
        );
        continue;
      }

      const histData = await histRes.json();

      // Always advance the stored historyId
      const newHistoryId: string = histData.historyId
        ? String(histData.historyId)
        : credentials.history_id;

      if (!histData.history?.length) {
        if (newHistoryId !== credentials.history_id) {
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
        continue;
      }

      // Collect newly added message IDs
      const newMessageIds: string[] = (
        histData.history as Array<{
          messagesAdded?: Array<{ message: { id: string } }>;
        }>
      ).flatMap((h) => h.messagesAdded?.map((m) => m.message.id) ?? []);

      // Look up company name once
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
        const msg = await msgRes.json();

        const headers = (msg.payload?.headers ?? []) as Array<{ name: string; value: string }>;
        const from    = getHeader(headers, "From");
        const subject = getHeader(headers, "Subject") || "(no subject)";

        // Skip outbound messages sent from the connected account
        if (from.includes(credentials.email)) continue;

        const senderEmail = from.match(/<(.+?)>/)?.[1] ?? from.trim();
        const body        = extractEmailBody(msg.payload ?? {});
        const receivedAt  = new Date(parseInt(msg.internalDate)).toISOString();

        await supabase.from("tickets").insert({
          company_id:     companyId,
          company_name:   company?.name ?? "",
          email:          senderEmail,
          issue_category: "general",
          priority:       "medium",
          description:    `Subject: ${subject}\n\n${body}`.trim(),
          status:         "open",
          source:         "gmail",
          created_at:     receivedAt,
        });

        totalCreated++;
      }

      // Advance historyId
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
      console.error(`Gmail watch error for company ${companyId}:`, err);
    }
  }

  return NextResponse.json({ processed: totalCreated });
}
