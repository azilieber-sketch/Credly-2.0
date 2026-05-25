"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/_lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type Channel = "gmail" | "slack" | "hubspot" | "instagram";

interface Integration {
  id: string;
  company_id: string;
  channel: Channel;
  status: "connected" | "disconnected";
  credentials: Record<string, string>;
  created_at: string;
}

interface ChannelConfig {
  id: Channel;
  name: string;
  desc: string;
  comingSoon?: boolean;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

// ── Channel config ─────────────────────────────────────────────────────────────

const CHANNELS: ChannelConfig[] = [
  {
    id: "gmail",
    name: "Gmail",
    desc: "Receive and send customer emails directly from your inbox.",
    fields: [
      { key: "email",        label: "Gmail address", placeholder: "you@gmail.com" },
      { key: "app_password", label: "App password",  placeholder: "xxxx xxxx xxxx xxxx", secret: true },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Post ticket alerts and updates to your Slack workspace.",
    fields: [
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/...", secret: true },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    desc: "Sync contacts and ticket history with your HubSpot CRM.",
    fields: [
      { key: "api_key", label: "API key", placeholder: "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", secret: true },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    desc: "Manage DMs and comments from your business account.",
    comingSoon: true,
    fields: [],
  },
];

// ── Icons ──────────────────────────────────────────────────────────────────────

function ChannelIcon({ channel, active }: { channel: Channel; active: boolean }) {
  const cls = active ? "text-indigo-600" : "text-stone-400";
  if (channel === "gmail") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
  if (channel === "slack") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <line x1="9"  y1="2"  x2="7"  y2="22" />
      <line x1="17" y1="2"  x2="15" y2="22" />
      <line x1="2"  y1="9"  x2="22" y2="9"  />
      <line x1="2"  y1="15" x2="22" y2="15" />
    </svg>
  );
  if (channel === "hubspot") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="4"  r="2" />
      <circle cx="20" cy="18" r="2" />
      <circle cx="4"  cy="18" r="2" />
      <line x1="12"   y1="6"    x2="12"   y2="9"    />
      <line x1="18.5" y1="17"   x2="14.5" y2="14.5" />
      <line x1="5.5"  y1="17"   x2="9.5"  y2="14.5" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Connect modal ──────────────────────────────────────────────────────────────

function ConnectModal({
  config,
  onClose,
  onSave,
}: {
  config: ChannelConfig;
  onClose: () => void;
  onSave: (creds: Record<string, string>) => Promise<void>;
}) {
  const [fields,  setFields]  = useState<Record<string, string>>(
    Object.fromEntries(config.fields.map((f) => [f.key, ""]))
  );
  const [saving, setSaving] = useState(false);

  const valid = config.fields.every((f) => fields[f.key]?.trim());

  const handle = async () => {
    if (!valid || saving) return;
    setSaving(true);
    await onSave(fields);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-900">Connect {config.name}</h2>
          <button
            onClick={onClose}
            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 text-xl"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-stone-500 mb-5">{config.desc}</p>

        <div className="flex flex-col gap-3.5">
          {config.fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">
                {f.label}
              </label>
              <input
                type={f.secret ? "password" : "text"}
                placeholder={f.placeholder}
                value={fields[f.key]}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-stone-50"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handle}
          disabled={!valid || saving}
          className="w-full mt-5 text-sm font-semibold bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Connecting…" : `Connect ${config.name}`}
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations,  setIntegrations]  = useState<Integration[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [companyId,     setCompanyId]     = useState<string | null>(null);
  const [noAccount,     setNoAccount]     = useState(false);
  const [modalChannel,  setModalChannel]  = useState<Channel | null>(null);
  const [toast,         setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("email", session.user.email!)
      .single();

    if (!company) { setNoAccount(true); setLoading(false); return; }
    setCompanyId(company.id);

    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("company_id", company.id);

    setIntegrations((data as Integration[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConnect = async (channel: Channel, credentials: Record<string, string>) => {
    if (!supabase || !companyId) return;
    await supabase.from("integrations").upsert(
      { company_id: companyId, channel, status: "connected", credentials },
      { onConflict: "company_id,channel" }
    );
    await load();
    showToast(`${CHANNELS.find((c) => c.id === channel)?.name} connected`);
  };

  const handleDisconnect = async (channel: Channel) => {
    if (!supabase || !companyId) return;
    await supabase.from("integrations").upsert(
      { company_id: companyId, channel, status: "disconnected", credentials: {} },
      { onConflict: "company_id,channel" }
    );
    await load();
    showToast("Integration disconnected");
  };

  const getIntegration = (channel: Channel) =>
    integrations.find((i) => i.channel === channel && i.status === "connected") ?? null;

  const modalConfig = CHANNELS.find((c) => c.id === modalChannel);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {modalChannel && modalConfig && (
        <ConnectModal
          config={modalConfig}
          onClose={() => setModalChannel(null)}
          onSave={(creds) => handleConnect(modalChannel, creds)}
        />
      )}

      {/* ── Header ── */}
      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Integrations
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Connect your channels
        </h1>
        <p className="text-stone-400 mt-2 text-sm">
          Link your tools to bring customer conversations into Credly.
        </p>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : noAccount ? (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">No account found</p>
          <p className="text-sm text-stone-400">
            Your account isn&apos;t linked to a company yet. Contact your administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => {
            const integration = getIntegration(ch.id);
            const connected   = !!integration;

            return (
              <div
                key={ch.id}
                className={`bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4 ${
                  ch.comingSoon ? "opacity-60" : ""
                }`}
              >
                {/* Top row: icon + status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    connected ? "bg-indigo-50" : "bg-stone-100"
                  }`}>
                    <ChannelIcon channel={ch.id} active={connected} />
                  </div>

                  {ch.comingSoon ? (
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

                {/* Name + description */}
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 mb-1">{ch.name}</p>
                  <p className="text-xs text-stone-400 leading-relaxed">{ch.desc}</p>
                  {connected && integration.credentials?.email && (
                    <p className="text-xs font-medium text-stone-500 mt-2 truncate">
                      {integration.credentials.email}
                    </p>
                  )}
                </div>

                {/* Action button */}
                {!ch.comingSoon && (
                  connected ? (
                    <button
                      onClick={() => handleDisconnect(ch.id)}
                      className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setModalChannel(ch.id)}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Connect →
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
