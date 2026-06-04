"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/app/_lib/supabase";
import { SourceIconRaw } from "@/app/_components/SourceIcon";
import { getCurrentWorkspace, Workspace } from "@/app/_lib/workspace";

interface IntegrationRow {
  channel: string;
  status: string;
  credentials: Record<string, string>;
}

interface ChannelConfig {
  id: string;
  name: string;
  provider: string;
  desc: string;
  real: boolean; // whether a real connect flow exists
}

const CHANNELS: ChannelConfig[] = [
  { id: "gmail",     name: "Gmail",     provider: "Google", desc: "Receive and reply to customer emails directly in your inbox.", real: true  },
  { id: "instagram", name: "Instagram", provider: "Meta",   desc: "Manage DMs and comments from your business account.",          real: false },
  { id: "slack",     name: "Slack",     provider: "Slack",  desc: "Post ticket alerts and updates to your Slack workspace.",        real: false },
  { id: "hubspot",   name: "HubSpot",   provider: "HubSpot",desc: "Sync contacts and conversations with your CRM.",                 real: false },
];

function IntegrationsInner() {
  const [workspace,   setWorkspace]   = useState<Workspace | null>(null);
  const [rows,        setRows]        = useState<IntegrationRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [noWorkspace, setNoWorkspace] = useState(false);
  const [busy,        setBusy]        = useState<string | null>(null);
  const [toast,       setToast]       = useState<string | null>(null);

  const searchParams = useSearchParams();
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const ws = await getCurrentWorkspace(supabase);
    if (!ws) { setNoWorkspace(true); setLoading(false); return; }
    setWorkspace(ws);
    const { data } = await supabase
      .from("integrations")
      .select("channel, status, credentials")
      .eq("workspace_id", ws.id);
    setRows((data as IntegrationRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      if (searchParams.get("gmail") === "connected") showToast("Gmail connected successfully");
      if (searchParams.get("error") === "gmail_auth_failed") showToast("Gmail connection failed — please try again");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectedRow = (id: string) =>
    rows.find((r) => r.channel === id && r.status === "connected") ?? null;

  const connectGmail = () => {
    if (workspace) window.location.href = `/api/integrations/gmail/auth?workspace_id=${workspace.id}`;
  };

  const disconnect = async (id: string) => {
    if (!supabase || !workspace) return;
    setBusy(id);
    await supabase.from("integrations").upsert(
      { workspace_id: workspace.id, channel: id, status: "disconnected", credentials: {} },
      { onConflict: "workspace_id,channel" }
    );
    await load();
    setBusy(null);
    showToast("Integration disconnected");
  };

  if (!supabase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">Not configured</p>
          <p className="text-sm text-stone-500">Supabase environment variables are missing.</p>
        </div>
      </div>
    );
  }

  if (noWorkspace && !loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">No workspace found</p>
          <p className="text-sm text-stone-500">Your account isn&apos;t linked to a workspace yet. Try signing out and back in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Integrations
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Channels</h1>
        <p className="text-stone-400 mt-2 text-sm">
          Connect a channel so its customer messages land in {workspace ? <span className="font-medium text-stone-600">{workspace.name}</span> : "your"}&apos;s inbox.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => {
            const row       = connectedRow(ch.id);
            const connected = !!row;
            return (
              <div
                key={ch.id}
                className={`bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4 ${
                  ch.real ? "" : "opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    connected ? "bg-indigo-50" : "bg-stone-100"
                  }`}>
                    <SourceIconRaw source={ch.id} size={22} />
                  </div>

                  {!ch.real ? (
                    <span className="text-[10px] font-semibold tracking-wider uppercase bg-stone-100 text-stone-400 px-2 py-0.5 rounded-md flex-shrink-0">
                      Soon
                    </span>
                  ) : connected ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
                      Not connected
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 mb-1">{ch.name}</p>
                  <p className="text-xs text-stone-400 leading-relaxed">{ch.desc}</p>
                  {connected && row?.credentials?.email && (
                    <p className="text-xs font-medium text-stone-500 mt-2 truncate">{row.credentials.email}</p>
                  )}
                </div>

                {!ch.real ? (
                  <button
                    disabled
                    className="text-xs font-semibold text-stone-400 bg-stone-50 border border-stone-100 px-3 py-2 rounded-lg cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                ) : connected ? (
                  <button
                    onClick={() => disconnect(ch.id)}
                    disabled={busy === ch.id}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                  >
                    {busy === ch.id ? "Working…" : "Disconnect"}
                  </button>
                ) : (
                  <button
                    onClick={connectGmail}
                    className="text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all"
                  >
                    Connect with {ch.provider} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-stone-400 mt-6 leading-relaxed">
        Connecting Gmail redirects you to Google to authorize access. Real tokens are stored against this workspace; messages then flow into your inbox automatically.
      </p>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <IntegrationsInner />
    </Suspense>
  );
}
