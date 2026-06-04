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
    .select("workspace_id, company_id, email")
    .eq("id", ticket_id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Find the connected Gmail integration for this ticket's workspace (preferred)
  // or its legacy company.
  let query = supabase
    .from("integrations")
    .select("id, credentials")
    .eq("channel", "gmail")
    .eq("status", "connected");

  if (ticket.workspace_id)      query = query.eq("workspace_id", ticket.workspace_id);
  else if (ticket.company_id)   query = query.eq("company_id", ticket.company_id);
  else return NextResponse.json({ error: "No tenant on ticket" }, { status: 404 });

  const { data: integration } = await query.single();

  if (!integration) {
    return NextResponse.json({ error: "Gmail not connected for this workspace" }, { status: 404 });
  }

  const credentials = integration.credentials as GmailCredentials;

  const accessToken = await getValidAccessToken(credentials, async (updated) => {
    await supabase.from("integrations").update({ credentials: updated }).eq("id", integration.id);
  });

  await sendEmail(accessToken, ticket.email, "Re: Your Support Request", reply_text);

  return NextResponse.json({ ok: true });
}
