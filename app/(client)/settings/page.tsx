"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopUpModal from "@/app/_components/TopUpModal";
import { getClient, saveClient, ClientData, DEFAULT_CLIENT, PLANS } from "@/app/_lib/store";

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-6">
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
  <div className="flex items-center justify-between py-3.5 border-b border-stone-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-stone-400 mt-0.5">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-indigo-600" : "bg-stone-200"}`}
      aria-checked={checked}
      role="switch"
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  const [client, setClient]       = useState<ClientData>(DEFAULT_CLIENT);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [saved, setSaved]         = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const load = () => {
    const data = getClient();
    setClient(data);
    setEmail(localStorage.getItem("userEmail") ?? "");
    setName(data.name || (localStorage.getItem("userEmail") ?? "").split("@")[0]);
  };

  useEffect(() => { load(); }, []);

  const saveProfile = () => {
    const updated = { ...client, name };
    saveClient(updated);
    setClient(updated);
    localStorage.setItem("userName", name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setNotification = (key: keyof ClientData["notifications"], value: boolean) => {
    const updated = { ...client, notifications: { ...client.notifications, [key]: value } };
    saveClient(updated);
    setClient(updated);
  };

  const deleteAccount = () => {
    localStorage.removeItem("credly_client");
    localStorage.removeItem("credly_companies");
    localStorage.removeItem("credly_admin_invoices");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    router.push("/");
  };

  const currentPlan = PLANS.find((p) => p.name === client.plan) ?? PLANS[1];

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} onSuccess={load} />}

      {/* ── Header ── */}
      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Settings
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Account settings</h1>
        <p className="text-stone-400 mt-2 text-sm">Manage your profile, notifications, and integrations.</p>
      </div>

      {/* ── Profile ── */}
      <section className="mb-10">
        <SectionHeader title="Profile" description="Your name and email address." />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-stone-50/80 cursor-not-allowed opacity-60"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && <p className="text-xs text-emerald-600 font-medium">Saved!</p>}
            <button
              onClick={saveProfile}
              className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all"
            >
              Save changes
            </button>
          </div>
        </div>
      </section>

      {/* ── Plan & Billing ── */}
      <section className="mb-10">
        <SectionHeader title="Plan & billing" description="Your current credit plan." />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{currentPlan.name}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {client.creditsTotal.toLocaleString()} credits total · {currentPlan.priceStr} one-time
              </p>
            </div>
            <button
              onClick={() => setTopUpOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Top up
            </button>
          </div>
        </div>
      </section>

      {/* ── Notifications ── */}
      <section className="mb-10">
        <SectionHeader title="Notifications" description="Choose which emails you receive." />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-6">
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

      {/* ── Integrations ── */}
      <section className="mb-10">
        <SectionHeader title="Integrations" description="Connect your tools to enrich AI context." />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-6">
          {[
            { name: "Shopify",  desc: "Sync order and customer data"    },
            { name: "Zendesk",  desc: "Pull ticket history and macros"  },
            { name: "Gorgias",  desc: "Import helpdesk rules and tags"  },
          ].map((item, i, arr) => (
            <div key={item.name} className={`flex items-center justify-between py-4 ${i < arr.length - 1 ? "border-b border-stone-100" : ""}`}>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-stone-400">{item.desc}</p>
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-stone-100 text-stone-400 px-2 py-1 rounded-md">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Danger zone ── */}
      <section>
        <SectionHeader title="Danger zone" description="Irreversible actions — proceed with care." />
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Delete account</p>
              <p className="text-xs text-stone-400 mt-0.5">Permanently remove your account and all data.</p>
            </div>
            <button
              onClick={deleteAccount}
              className="text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
