import type { SupabaseClient } from "@supabase/supabase-js";

// The tenant a signed-in user is acting in.
export interface Workspace {
  id: string;
  name: string;
  brand_voice: string | null;
  company_details: Record<string, unknown> | null;
  industry: string | null;
  website: string | null;
  support_email: string | null;
}

interface MembershipRow {
  role: string;
  workspace: Workspace | null;
}

// Resolve the current user's workspace via workspace_members.
//
// SIMPLIFICATION: we assume one workspace per user (the one they own, created
// by the signup trigger). If a user somehow belongs to several, we prefer the
// one they own, else the first. A workspace switcher can come later.
export async function getCurrentWorkspace(
  supabase: SupabaseClient
): Promise<Workspace | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, workspace:workspaces(id, name, brand_voice, company_details, industry, website, support_email)"
    )
    .eq("user_id", session.user.id);

  if (error || !data || data.length === 0) return null;

  const rows = data as unknown as MembershipRow[];
  const owner = rows.find((r) => r.role === "owner") ?? rows[0];
  return owner.workspace ?? null;
}
