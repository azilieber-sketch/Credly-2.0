"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/_lib/supabase";
import { getCurrentWorkspace, Workspace } from "@/app/_lib/workspace";

export default function SettingsPage() {
  const router = useRouter();
  const [email,       setEmail]       = useState<string>("");
  const [workspace,   setWorkspace]   = useState<Workspace | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);

  const [name,         setName]         = useState("");
  const [industry,     setIndustry]     = useState("");
  const [website,      setWebsite]      = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(session?.user?.email ?? "");
      const ws = await getCurrentWorkspace(supabase);
      if (ws) {
        setWorkspace(ws);
        setName(ws.name ?? "");
        setIndustry(ws.industry ?? "");
        setWebsite(ws.website ?? "");
        setSupportEmail(ws.support_email ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!supabase || !workspace || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({
        name: name.trim(),
        industry: industry.trim() || null,
        website: website.trim() || null,
        support_email: supportEmail.trim() || null,
      })
      .eq("id", workspace.id);
    setSaving(false);
    showToast(error ? "Save failed — please try again" : "Workspace updated");
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
        <p className="text-stone-400 mt-2 text-sm">Manage your workspace and account.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Workspace (editable) */}
          <section>
            <div className="mb-3">
              <h2 className="text-base font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-stone-400 mt-0.5">These details describe your company. Brand voice lives on its own page.</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
              <InputControl label="Workspace name" value={name} onChange={setName} placeholder="Acme Support" />
              <InputControl label="Industry" value={industry} onChange={setIndustry} placeholder="E-commerce" />
              <InputControl label="Website" value={website} onChange={setWebsite} placeholder="https://acme.com" />
              <InputControl label="Support email" value={supportEmail} onChange={setSupportEmail} placeholder="support@acme.com" type="email" />
              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={save}
                  disabled={saving || !name.trim()}
                  className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section>
            <div className="mb-3">
              <h2 className="text-base font-bold text-gray-900">Account</h2>
              <p className="text-sm text-stone-400 mt-0.5">You&apos;re signed in to this workspace.</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{email || "—"}</p>
                <p className="text-xs text-stone-400 mt-0.5">Owner</p>
              </div>
              <button
                onClick={logout}
                className="text-xs font-semibold text-stone-600 border border-stone-200 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0"
              >
                Log out
              </button>
            </div>
          </section>

          {/* Placeholder for later */}
          <section>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Team</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">Invite agents to share this workspace&apos;s inbox.</p>
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-stone-100 text-stone-400 px-2 py-0.5 rounded-md flex-shrink-0">
                Soon
              </span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// Module-scoped input so it doesn't remount (and lose focus) on each keystroke.
function InputControl({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
      />
    </div>
  );
}
