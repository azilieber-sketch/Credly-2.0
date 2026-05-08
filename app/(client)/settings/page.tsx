"use client";

import { useEffect, useState } from "react";

// ─── Components ───────────────────────────────────────────────────────────────

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-6">
    <h2 className="text-base font-bold text-gray-900">{title}</h2>
    <p className="text-sm text-stone-400 mt-0.5">{description}</p>
  </div>
);

const Toggle = ({ label, description, defaultOn = false }: { label: string; description: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-stone-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-stone-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-indigo-600" : "bg-stone-200"}`}
        aria-checked={on}
        role="switch"
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
};

const IntegrationRow = ({
  name,
  description,
  icon,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-stone-400">{description}</p>
      </div>
    </div>
    <span className="text-[10px] font-semibold tracking-wider uppercase bg-stone-100 text-stone-400 px-2 py-1 rounded-md">
      Coming soon
    </span>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("userEmail") ?? "";
    setEmail(stored);
    setName(stored.split("@")[0] ?? "");
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">

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
          <div className="flex justify-end pt-1">
            <button className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all">
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
              <p className="text-sm font-semibold text-gray-900">Growth</p>
              <p className="text-xs text-stone-400 mt-0.5">2,000 credits · one-time purchase</p>
            </div>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
              Top up
            </button>
          </div>
        </div>
      </section>

      {/* ── Notifications ── */}
      <section className="mb-10">
        <SectionHeader title="Notifications" description="Choose which emails you receive." />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-6">
          <Toggle label="Weekly usage report" description="A summary of your credit usage every Monday." defaultOn={true} />
          <Toggle label="Low credit alert" description="Notify me when my balance drops below 10%." defaultOn={true} />
          <Toggle label="Invoice issued" description="An email each time a new invoice is generated." defaultOn={false} />
        </div>
      </section>

      {/* ── Integrations ── */}
      <section className="mb-10">
        <SectionHeader title="Integrations" description="Connect your tools to enrich AI context." />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-6">
          <IntegrationRow
            name="Shopify"
            description="Sync order and customer data"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          />
          <IntegrationRow
            name="Zendesk"
            description="Pull ticket history and macros"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <IntegrationRow
            name="Gorgias"
            description="Import helpdesk rules and tags"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          />
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
            <button className="text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Delete account
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
