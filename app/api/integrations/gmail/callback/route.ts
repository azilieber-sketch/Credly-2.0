import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code      = searchParams.get("code");
  const companyId = searchParams.get("state");
  const error     = searchParams.get("error");

  const failUrl = `${origin}/admin/companies/${companyId ?? ""}?error=gmail_auth_failed`;

  if (error || !code || !companyId) {
    return NextResponse.redirect(failUrl);
  }

  const redirectUri = `${origin}/api/integrations/gmail/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.access_token) return NextResponse.redirect(failUrl);

  // Get Gmail profile (email address + current historyId)
  const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profile.emailAddress) return NextResponse.redirect(failUrl);

  // Register Gmail push watch — tells Gmail to publish to our Pub/Sub topic on new mail.
  // Watch expires after 7 days; the cron at /api/integrations/gmail/watch renews it.
  const watchRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName: "projects/spheric-algebra-497814-d9/topics/gmail-notifications",
      labelIds: ["INBOX"],
    }),
  });
  const watchData = await watchRes.json();

  // Prefer the historyId from watch() — it's the correct starting point for push notifications.
  // Fall back to profile.historyId if watch() failed.
  const historyId = watchData.historyId
    ? String(watchData.historyId)
    : String(profile.historyId);

  const credentials: Record<string, string> = {
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
    email:         profile.emailAddress,
    token_expiry:  new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    history_id:    historyId,
  };
  if (watchData.expiration) {
    credentials.watch_expiry = String(watchData.expiration);
  }

  const supabase = getServiceSupabase();
  await supabase.from("integrations").upsert(
    { company_id: companyId, channel: "gmail", status: "connected", credentials },
    { onConflict: "company_id,channel" }
  );

  return NextResponse.redirect(`${origin}/admin/companies/${companyId}?gmail=connected`);
}
