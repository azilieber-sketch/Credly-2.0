import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/app/_lib/supabase-server";

// Server-only client-account management. Uses the Supabase service role key
// (never exposed to the browser) to create/delete Auth users + their company.
// Every request is gated to the admin account.

const ADMIN_EMAIL = "admin@credly.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Guard =
  | { ok: true; supabase: ReturnType<typeof getServiceSupabase> }
  | { ok: false; status: number; error: string };

async function requireAdmin(req: NextRequest): Promise<Guard> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: "Not authenticated." };

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { ok: false, status: 401, error: "Invalid session." };
  if (data.user.email !== ADMIN_EMAIL) {
    return { ok: false, status: 403, error: "Admin access required." };
  }
  return { ok: true, supabase };
}

// ── Create client: confirmed Auth user + matching companies row ───────────────
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const supabase = guard.supabase;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const name      = String(body.name ?? "").trim();
  const email     = String(body.email ?? "").trim().toLowerCase();
  const password  = String(body.password ?? "");
  const industry  = String(body.industry ?? "Other").trim() || "Other";
  const credits   = Number.isFinite(Number(body.credits)) ? Number(body.credits) : 0;
  const inquiryId = body.inquiryId ? String(body.inquiryId) : null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Company name, email, and password are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8)   return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });

  // Block duplicates up front so we never half-create.
  const { data: existing } = await supabase.from("companies").select("id").eq("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "A client with this email already exists." }, { status: 409 });

  // 1) Create the login — confirmed so they can sign in immediately.
  const { data: createdUser, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !createdUser?.user) {
    return NextResponse.json({ error: userErr?.message ?? "Could not create the login." }, { status: 400 });
  }

  // 2) Create the matching company row (email MUST match the auth user — the app
  //    links a logged-in user to their company by email).
  const { data: company, error: coErr } = await supabase
    .from("companies")
    .insert({ name, email, industry, credits, credits_used: 0, status: "active" })
    .select()
    .single();

  if (coErr || !company) {
    // Roll back the auth user so we don't leave an orphan login.
    await supabase.auth.admin.deleteUser(createdUser.user.id).catch(() => {});
    return NextResponse.json({ error: `Could not create the company: ${coErr?.message ?? "unknown error"}` }, { status: 400 });
  }

  // 3) If this came from an inquiry, mark it contacted so the leads list stays clean.
  if (inquiryId) {
    await supabase.from("inquiries").update({ status: "contacted" }).eq("id", inquiryId);
  }

  return NextResponse.json({ ok: true, company, email });
}

// ── Delete client: company row + tickets + integrations + Auth user ───────────
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const supabase = guard.supabase;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const companyId = body.companyId ? String(body.companyId) : null;
  if (!companyId) return NextResponse.json({ error: "companyId is required." }, { status: 400 });

  const { data: company } = await supabase
    .from("companies").select("id, email").eq("id", companyId).maybeSingle();
  if (!company) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  // Never let this route nuke the admin account.
  if (company.email === ADMIN_EMAIL) {
    return NextResponse.json({ error: "Refusing to delete the admin account." }, { status: 400 });
  }

  // Remove their data first (FK-safe order: children before parent).
  const { count: ticketsDeleted }      = await supabase.from("tickets").delete({ count: "exact" }).eq("company_id", companyId);
  const { count: integrationsDeleted } = await supabase.from("integrations").delete({ count: "exact" }).eq("company_id", companyId);
  const { error: coDelErr } = await supabase.from("companies").delete().eq("id", companyId);
  if (coDelErr) return NextResponse.json({ error: `Could not delete the company: ${coDelErr.message}` }, { status: 400 });

  // Delete the Auth user (matched by email) so they can no longer log in.
  let authUserDeleted = false;
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const match = list?.users.find((u) => (u.email ?? "").toLowerCase() === company.email.toLowerCase());
  if (match) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(match.id);
    authUserDeleted = !delErr;
  }

  return NextResponse.json({
    ok: true,
    deleted: {
      email: company.email,
      tickets: ticketsDeleted ?? 0,
      integrations: integrationsDeleted ?? 0,
      authUser: authUserDeleted,
    },
  });
}
