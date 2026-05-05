"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Static data ──────────────────────────────────────────────────────────────

const metrics = [
  {
    label: "Conversations today",
    value: "24",
    sub: "+8 from yesterday",
    subColor: "text-emerald-500",
  },
  {
    label: "Pending issues",
    value: "3",
    sub: "Needs attention",
    subColor: "text-amber-500",
  },
  {
    label: "Avg response time",
    value: "2m",
    sub: "Across all channels",
    subColor: "text-stone-400",
  },
];

const CREDITS_TOTAL = 150;
const CREDITS_USED = 30;
const CREDITS_REMAINING = CREDITS_TOTAL - CREDITS_USED;

const activity = [
  {
    status: "resolved",
    type: "order",
    title: "Order inquiry resolved",
    sub: "Customer asked about delivery status",
    time: "2m ago",
  },
  {
    status: "resolved",
    type: "refund",
    title: "Refund request processed",
    sub: "Processed via standard returns policy",
    time: "8m ago",
  },
  {
    status: "resolved",
    type: "chat",
    title: "Shipping question answered",
    sub: "International delivery timeline confirmed",
    time: "15m ago",
  },
  {
    status: "pending",
    type: "return",
    title: "Product return initiated",
    sub: "Wrong size — replacement arranged",
    time: "34m ago",
  },
  {
    status: "escalated",
    type: "alert",
    title: "Payment dispute escalated",
    sub: "Flagged for human review",
    time: "1h ago",
  },
];

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "conversations",
    label: "Conversations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "usage",
    label: "Usage",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ─── Activity icons ───────────────────────────────────────────────────────────

const activityIcon: Record<string, { emoji: string; bg: string }> = {
  order:  { emoji: "📦", bg: "bg-indigo-50" },
  refund: { emoji: "🔁", bg: "bg-emerald-50" },
  chat:   { emoji: "💬", bg: "bg-sky-50" },
  return: { emoji: "🔁", bg: "bg-violet-50" },
  alert:  { emoji: "⚠️", bg: "bg-red-50" },
};

const statusLabel: Record<string, { text: string; class: string }> = {
  resolved: { text: "Resolved",  class: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  pending:  { text: "Pending",   class: "bg-amber-50 text-amber-600 border-amber-100" },
  escalated: { text: "Escalated", class: "bg-red-50 text-red-600 border-red-100" },
};

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.replace("/");
      return;
    }
    setEmail(localStorage.getItem("userEmail"));
    setReady(true);
  }, [router]);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    router.push("/");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = email ? email.split("@")[0] : null;
  const creditPct = Math.round((CREDITS_USED / CREDITS_TOTAL) * 100);

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-white border-r border-stone-200/60 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-5 h-[64px] flex items-center border-b border-stone-100">
          <button
            onClick={() => router.push(localStorage.getItem("isLoggedIn") ? "/dashboard" : "/")}
            className="text-lg font-bold tracking-tight text-gray-900 hover:text-indigo-700 transition-colors"
          >
            Credly
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "conversations") router.push("/conversations");
                  else if (item.id === "usage")    router.push("/usage");
                  else setActiveNav(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-100/80"
                    : "font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <span className={isActive ? "text-indigo-500" : "text-stone-400"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom: email + logout */}
        <div className="px-3 py-4 border-t border-stone-100">
          {email && (
            <p className="text-[11px] text-stone-400 px-3 mb-2 truncate">{email}</p>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-all text-left"
          >
            <span className="text-stone-400"><LogOutIcon /></span>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">

          {/* Header */}
          <div className="mb-10">
            {displayName && (
              <p className="text-sm text-stone-400 mb-2">Good morning, {displayName}.</p>
            )}
            <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
              Dashboard
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
              Here&apos;s what your support<br />handled today.
            </h1>
            <p className="text-stone-400 mt-2 text-sm leading-relaxed">
              Your AI agents are actively managing customer conversations.
            </p>
          </div>

          {/* ── Support Activity (dominant section) ── */}
          <section className="mb-8">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Support Activity
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-white rounded-2xl p-7 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-4 leading-snug">
                    {m.label}
                  </p>
                  <p className="text-4xl font-black text-gray-900 leading-none mb-2">
                    {m.value}
                  </p>
                  <p className={`text-xs font-medium ${m.subColor}`}>{m.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Credits ── */}
          <section className="mb-8">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Credits
            </p>
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">
                    {CREDITS_REMAINING}
                    <span className="text-sm font-semibold text-stone-400 ml-1.5">remaining</span>
                  </p>
                  <p className="text-sm text-stone-400 mt-1">
                    {CREDITS_USED} credits used this month
                  </p>
                </div>
                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                  Top up
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-100 rounded-full h-2 mb-2.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all"
                  style={{ width: `${creditPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-400">
                  {creditPct}% of {CREDITS_TOTAL} credits used
                </p>
                <p className="text-xs font-medium text-emerald-500">On track for this month</p>
              </div>
            </div>
          </section>

          {/* ── Activity Feed ── */}
          <section>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Recent Activity
            </p>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">

              {/* Group label */}
              <div className="px-5 py-2.5 bg-stone-50/80 border-b border-stone-100">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                  Today
                </p>
              </div>

              {activity.map((item, i) => {
                const icon = activityIcon[item.type];
                const badge = statusLabel[item.status];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-stone-50/60 transition-colors ${
                      i < activity.length - 1 ? "border-b border-stone-100" : ""
                    }`}
                  >
                    {/* Type icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${icon.bg}`}
                    >
                      <span className="text-sm leading-none">{icon.emoji}</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{item.sub}</p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.class}`}
                    >
                      {badge.text}
                    </span>

                    {/* Time */}
                    <span className="text-[11px] text-stone-300 flex-shrink-0 w-10 text-right">
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
