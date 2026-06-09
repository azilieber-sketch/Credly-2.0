"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopUpModal from "@/app/_components/TopUpModal";
import { getClient, saveClient, ClientData, DEFAULT_CLIENT, PLANS } from "@/app/_lib/store";
import { supabase } from "@/app/_lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "account" | "integrations";
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

// ── Shared components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-5">
    <h2 className="text-base font-bold text-gray-900">{title}</h2>
    <p className="text-sm text-stone-400 mt-0.5">{description}</p>
  </div>
);

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const Toggle = ({ label, description, checked, onChange }: ToggleProps) => (
  <div className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0 gap-4">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-indigo-600" : "bg-stone-200"}`}
      aria-checked={checked}
      role="switch"
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  </div>
);

// ── Channel icon ───────────────────────────────────────────────────────────────

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
  const [fields, setFields] = useState<Record<string, string>>(
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

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("account");

  // Account tab state
  const [client, setClient]       = useState<ClientData>(DEFAULT_CLIENT);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [saved, setSaved]         = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  // Change-password state
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving,  setPwdSaving]  = useState(false);
  const [pwdError,   setPwdError]   = useState<string | null>(null);
  const [pwdSaved,   setPwdSaved]   = useState(false);

  // Integrations tab state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [companyId, setCompanyId]       = useState<string | null>(null);
  const [noAccount, setNoAccount]       = useState(false);
  const [intLoading, setIntLoading]     = useState(false);
  const [modalChannel, setModalChannel] = useState<Channel | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadAccount = async () => {
    const data = getClient();
    setClient(data);
    const sessionEmail = supabase
      ? (await supabase.auth.getSession()).data.session?.user?.email ?? ""
      : "";
    setEmail(sessionEmail);
    setName(data.name || (sessionEmail ? sessionEmail.split("@")[0] : ""));
  };

  const loadIntegrations = useCallback(async () => {
    if (!supabase) { setIntLoading(false); return; }
    setIntLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIntLoading(false); return; }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("email", session.user.email!)
      .single();

    if (!company) { setNoAccount(true); setIntLoading(false); return; }
    setCompanyId(company.id);

    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("company_id", company.id);

    setIntegrations((data as Integration[]) ?? []);
    setIntLoading(false);
  }, []);

  useEffect(() => {
    loadAccount();
    loadIntegrations();
  }, [loadIntegrations]);

  const saveProfile = () => {
    const updated = { ...client, name };
    saveClient(updated);
    setClient(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changePassword = async () => {
    if (pwdSaving) return;
    if (!supabase) { setPwdError("Service not configured."); return; }
    setPwdError(null);
    setPwdSaved(false);
    if (newPwd.length < 8)       { setPwdError("Password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd)   { setPwdError("Those passwords don't match."); return; }

    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdSaving(false);
    if (error) { setPwdError(error.message); return; }

    setNewPwd("");
    setConfirmPwd("");
    setPwdSaved(true);
    setTimeout(() => setPwdSaved(false), 4000);
  };

  const setNotification = (key: keyof ClientData["notifications"], value: boolean) => {
    const updated = { ...client, notifications: { ...client.notifications, [key]: value } };
    saveClient(updated);
    setClient(updated);
  };

  const deleteAccount = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem("credly_client");
    localStorage.removeItem("credly_companies");
    localStorage.removeItem("credly_admin_invoices");
    router.push("/");
  };

  const handleConnect = async (channel: Channel, credentials: Record<string, string>) => {
    if (!supabase || !companyId) return;
    await supabase.from("integrations").upsert(
      { company_id: companyId, channel, status: "connected", credentials },
      { onConflict: "company_id,channel" }
    );
    await loadIntegrations();
    showToast(`${CHANNELS.find((c) => c.id === channel)?.name} connected`);
  };

  const handleDisconnect = async (channel: Channel) => {
    if (!supabase || !companyId) return;
    await supabase.from("integrations").upsert(
      { company_id: companyId, channel, status: "disconnected", credentials: {} },
      { onConflict: "company_id,channel" }
    );
    await loadIntegrations();
    showToast("Integration disconnected");
  };

  const getIntegration = (channel: Channel) =>
    integrations.find((i) => i.channel === channel && i.status === "connected") ?? null;

  const modalConfig  = CHANNELS.find((c) => c.id === modalChannel);
  const currentPlan  = PLANS.find((p) => p.name === client.plan) ?? PLANS[1];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} onSuccess={loadAccount} />}

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
          Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Account settings</h1>
        <p className="text-stone-400 mt-2 text-sm">Manage your profile, notifications, and integrations.</p>
      </div>

      {/* ── Tab nav ── */}
      <div className="flex border-b border-stone-100 mb-8">
        {(["account", "integrations"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Account tab ── */}
      {activeTab === "account" && (
        <>
          {/* Profile */}
          <section className="mb-8">
            <SectionHeader title="Profile" description="Your name and email address." />
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-stone-50/80 cursor-not-allowed opacity-60"
                />
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                {saved && <p className="text-xs text-emerald-600 font-medium">Saved!</p>}
                <button
                  onClick={saveProfile}
                  className="ml-auto text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all"
                >
                  Save changes
                </button>
              </div>
            </div>
          </section>

          {/* Password */}
          <section className="mb-8">
            <SectionHeader title="Password" description="Change the password you use to sign in." />
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">New password</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && changePassword()}
                  placeholder="Re-enter the new password"
                  autoComplete="new-password"
                  className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
                />
              </div>
              {pwdError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{pwdError}</p>
              )}
              <div className="flex items-center justify-between gap-3 pt-1">
                {pwdSaved && (
                  <p className="text-xs text-emerald-600 font-medium">Password updated — use it next time you sign in.</p>
                )}
                <button
                  onClick={changePassword}
                  disabled={pwdSaving || !newPwd || !confirmPwd}
                  className="ml-auto text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {pwdSaving ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>
          </section>

          {/* Plan & Billing */}
          <section className="mb-8">
            <SectionHeader title="Plan & billing" description="Your current credit plan." />
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{currentPlan.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {client.creditsTotal.toLocaleString()} credits total · {currentPlan.priceStr} one-time
                  </p>
                </div>
                <button
                  onClick={() => setTopUpOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  Top up
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <SectionHeader title="Notifications" description="Choose which emails you receive." />
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 sm:px-6">
              <Toggle
                label="Weekly usage report"
                description="A summary of your credit usage every Monday."
                checked={client.notifications.weeklyReport}
                onChange={(v) => setNotification("weeklyReport", v)}
              />
              <Toggle
                label="Low credit alert"
                description="Notify me when my balance drops below 10%."
                checked={client.notifications.lowCreditAlert}
                onChange={(v) => setNotification("lowCreditAlert", v)}
              />
              <Toggle
                label="Invoice issued"
                description="An email each time a new invoice is generated."
                checked={client.notifications.invoiceIssued}
                onChange={(v) => setNotification("invoiceIssued", v)}
              />
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <SectionHeader title="Danger zone" description="Irreversible actions — proceed with care." />
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Delete account</p>
                  <p className="text-xs text-stone-400 mt-0.5">Permanently remove your account and all data.</p>
                </div>
                <button
                  onClick={deleteAccount}
                  className="text-xs font-semibold text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  Delete account
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Integrations tab ── */}
      {activeTab === "integrations" && (
        intLoading ? (
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

                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 mb-1">{ch.name}</p>
                    <p className="text-xs text-stone-400 leading-relaxed">{ch.desc}</p>
                    {connected && integration.credentials?.email && (
                      <p className="text-xs font-medium text-stone-500 mt-2 truncate">
                        {integration.credentials.email}
                      </p>
                    )}
                  </div>

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
        )
      )}
    </div>
  );
}
