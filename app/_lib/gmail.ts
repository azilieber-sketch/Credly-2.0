// PARKED — direct Gmail OAuth integration (future premium feature).
// The live email pipeline is ActivePieces -> /api/email/inbound (see
// /api/tickets/[id]/reply for outbound). Do not delete without asking.
export interface GmailCredentials {
  access_token: string;
  refresh_token: string;
  email: string;
  token_expiry?: string;
  history_id?: string;
  watch_expiry?: string; // Unix ms string — Gmail watch expires every 7 days
}

interface GmailPayload {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
}

export async function getValidAccessToken(
  credentials: GmailCredentials,
  onRefresh: (updated: GmailCredentials) => Promise<void>
): Promise<string> {
  const expiry = credentials.token_expiry ? new Date(credentials.token_expiry) : null;
  const needsRefresh = !expiry || expiry.getTime() - Date.now() < 60_000;

  if (!needsRefresh) return credentials.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: credentials.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);

  const updated: GmailCredentials = {
    ...credentials,
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };

  await onRefresh(updated);
  return updated.access_token;
}

export function extractEmailBody(payload: GmailPayload): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(
      payload.body.data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractEmailBody(part);
      if (text) return text;
    }
  }
  return "";
}

export function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const raw = Buffer.from(mime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gmail send failed: ${JSON.stringify(err)}`);
  }
}
