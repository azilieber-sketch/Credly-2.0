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

  const credentials = {
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
    email:         profile.emailAddress,
    token_expiry:  new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    history_id:    String(profile.historyId),
  };

  const supabase = getServiceSupabase();
  await supabase.from("integrations").upsert(
    { company_id: companyId, channel: "gmail", status: "connected", credentials },
    { onConflict: "company_id,channel" }
  );

  return NextResponse.redirect(`${origin}/admin/companies/${companyId}?gmail=connected`);
}
