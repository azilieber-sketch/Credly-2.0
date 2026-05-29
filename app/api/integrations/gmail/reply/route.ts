import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";
import { GmailCredentials, getValidAccessToken, sendEmail } from "@/app/_lib/gmail";

export async function POST(req: NextRequest) {
  const { ticket_id, reply_text } = await req.json();
  if (!ticket_id || !reply_text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("company_id, email, description")
    .eq("id", ticket_id)
    .single();

  if (!ticket?.company_id) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: integration } = await supabase
    .from("integrations")
    .select("credentials")
    .eq("company_id", ticket.company_id)
    .eq("channel", "gmail")
    .eq("status", "connected")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Gmail not connected for this company" }, { status: 404 });
  }

  const credentials = integration.credentials as GmailCredentials;

  const accessToken = await getValidAccessToken(credentials, async (updated) => {
    await supabase.from("integrations").upsert(
      {
        company_id: ticket.company_id,
        channel: "gmail",
        status: "connected",
        credentials: updated,
      },
      { onConflict: "company_id,channel" }
    );
  });

  await sendEmail(accessToken, ticket.email, "Re: Your Support Request", reply_text);

  return NextResponse.json({ ok: true });
}
