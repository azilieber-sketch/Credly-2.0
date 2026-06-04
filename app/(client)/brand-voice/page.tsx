"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/_lib/supabase";
import { getCurrentWorkspace, Workspace } from "@/app/_lib/workspace";

// Module-scoped so it keeps a stable identity across renders (otherwise the
// textareas would remount and lose focus on every keystroke).
function Field({
  label, hint, value, onChange, placeholder, rows = 4,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">{label}</label>
      <p className="text-xs text-stone-400 -mt-0.5">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-stone-50 resize-none"
      />
    </div>
  );
}

export default function BrandVoicePage() {
  const [workspace,   setWorkspace]   = useState<Workspace | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [noWorkspace, setNoWorkspace] = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [tone,        setTone]        = useState("");
  const [dos,         setDos]         = useState("");
  const [donts,       setDonts]       = useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const ws = await getCurrentWorkspace(supabase);
      if (!ws) { setNoWorkspace(true); setLoading(false); return; }
      setWorkspace(ws);
      setTone(ws.brand_voice ?? "");
      const cd = (ws.company_details ?? {}) as Record<string, string>;
      setDescription(cd.description ?? "");
      setDos(cd.dos ?? "");
      setDonts(cd.donts ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!supabase || !workspace) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({
        brand_voice: tone.trim() || null,
        company_details: { description: description.trim(), dos: dos.trim(), donts: donts.trim() },
      })
      .eq("id", workspace.id);
    setSaving(false);
    showToast(error ? "Save failed — please try again" : "Brand voice saved");
  };

  if (!supabase) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">Not configured</p>
          <p className="text-sm text-stone-500">Supabase environment variables are missing.</p>
        </div>
      </div>
    );
  }

  if (noWorkspace && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">No workspace found</p>
          <p className="text-sm text-stone-500">Your account isn&apos;t linked to a workspace yet. Try signing out and back in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Brand Voice
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Brand voice</h1>
        <p className="text-stone-400 mt-2 text-sm">
          Teach Credly how your brand sounds. This is what future AI drafts will use to reply like you.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 flex flex-col gap-6">
          <Field
            label="Company description"
            hint="What your company does, who you serve, and what you sell."
            value={description}
            onChange={setDescription}
            placeholder="We're a sustainable apparel brand selling directly to consumers across the US…"
          />
          <Field
            label="Tone of voice"
            hint="How replies should feel — e.g. warm, concise, playful, professional."
            value={tone}
            onChange={setTone}
            rows={3}
            placeholder="Friendly and warm, but professional. Use plain language and short sentences."
          />
          <Field
            label="Do's"
            hint="Things agents and AI should always do."
            value={dos}
            onChange={setDos}
            placeholder="Greet the customer by name. Offer a clear next step. Thank them for their patience."
          />
          <Field
            label="Don'ts"
            hint="Things to avoid."
            value={donts}
            onChange={setDonts}
            placeholder="Don't make promises about delivery dates. Avoid jargon. Never blame the customer."
          />

          <div className="flex items-center justify-end pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save brand voice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
