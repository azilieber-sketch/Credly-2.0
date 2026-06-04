import { NextRequest, NextResponse } from "next/server";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export async function GET(req: NextRequest) {
  // Product surface passes workspace_id; legacy admin surface passes company_id.
  const workspaceId = req.nextUrl.searchParams.get("workspace_id");
  const companyId   = req.nextUrl.searchParams.get("company_id");
  if (!workspaceId && !companyId) {
    return NextResponse.json({ error: "Missing workspace_id or company_id" }, { status: 400 });
  }

  // Encode tenant type into state so the callback knows where to write + redirect.
  const state = workspaceId ? `ws:${workspaceId}` : `co:${companyId}`;

  const redirectUri = `${req.nextUrl.origin}/api/integrations/gmail/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
