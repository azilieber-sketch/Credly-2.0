// This cron renews Gmail push watch subscriptions before they expire (7-day TTL).
// Email ingestion is handled in real-time by /api/integrations/gmail/push via Pub/Sub.
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";
import { GmailCredentials, getValidAccessToken } from "@/app/_lib/gmail";

const TOPIC = "projects/spheric-algebra-497814-d9/topics/gmail-notifications";

// Renew when fewer than 24 hours remain on the watch
const RENEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

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

  if (!integrations?.length) return NextResponse.json({ renewed: 0 });

  let renewed = 0;

  for (const integration of integrations) {
    const companyId  = integration.company_id as string;
    const credentials = integration.credentials as GmailCredentials;

    try {
      // Check if watch is expiring soon (or has no recorded expiry)
      const expiry    = credentials.watch_expiry ? parseInt(credentials.watch_expiry) : 0;
      const expiresIn = expiry - Date.now();
      if (expiresIn > RENEW_THRESHOLD_MS) continue;

      const accessToken = await getValidAccessToken(credentials, async (updated) => {
        await supabase.from("integrations").upsert(
          { company_id: companyId, channel: "gmail", status: "connected", credentials: updated },
          { onConflict: "company_id,channel" }
        );
      });

      const watchRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicName: TOPIC, labelIds: ["INBOX"] }),
      });

      const watchData = await watchRes.json();
      if (!watchData.expiration) {
        console.error(`Watch renewal failed for ${companyId}:`, watchData);
        continue;
      }

      await supabase.from("integrations").upsert(
        {
          company_id: companyId,
          channel: "gmail",
          status: "connected",
          credentials: {
            ...credentials,
            watch_expiry: String(watchData.expiration),
            // Update historyId from the fresh watch response so push stays in sync
            history_id: watchData.historyId ? String(watchData.historyId) : credentials.history_id,
          },
        },
        { onConflict: "company_id,channel" }
      );

      renewed++;
    } catch (err) {
      console.error(`Watch renewal error for company ${companyId}:`, err);
    }
  }

  return NextResponse.json({ renewed });
}
