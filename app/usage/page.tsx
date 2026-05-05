"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CREDITS_TOTAL     = 150;
const CREDITS_USED      = 80;
const CREDITS_REMAINING = CREDITS_TOTAL - CREDITS_USED;

const breakdown = [
  { emoji: "📦", label: "Shipping",  credits: 45, bar: "bg-indigo-400" },
  { emoji: "🔁", label: "Returns",   credits: 20, bar: "bg-violet-400" },
  { emoji: "💬", label: "Inquiries", credits: 15, bar: "bg-sky-400"    },
];

const history = [
  { label: "Today",     credits: 12 },
  { label: "This week", credits: 48 },
];

// ─── SVG circle constants ─────────────────────────────────────────────────────

const R            = 52;
const CX           = 64;
const CY           = 64;
const CIRCUMFERENCE = 2 * Math.PI * R;

// ─── Sidebar nav (matches dashboard / conversations) ──────────────────────────

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

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsagePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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

  const progressOffset = CIRCUMFERENCE * (1 - CREDITS_USED / CREDITS_TOTAL);
  const historyMax     = Math.max(...history.map((h) => h.credits));

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-white border-r border-stone-200/60 flex flex-col flex-shrink-0">

        <div className="px-5 h-[64px] flex items-center border-b border-stone-100">
          <button
            onClick={() => router.push(localStorage.getItem("isLoggedIn") ? "/dashboard" : "/")}
            className="text-lg font-bold tracking-tight text-gray-900 hover:text-indigo-700 transition-colors"
          >
            Credly
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.id === "usage";
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "dashboard")     router.push("/dashboard");
                  if (item.id === "conversations") router.push("/conversations");
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
        <div className="max-w-2xl mx-auto px-8 py-10">

          {/* ── Header ── */}
          <div className="mb-10">
            <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
              Usage
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
              Track how your credits<br />are being used.
            </h1>
            <p className="text-stone-400 mt-2 text-sm leading-relaxed">
              A live view of your credit consumption this month.
            </p>
          </div>

          {/* ── Credits this month ── */}
          <section className="mb-10">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-6">
              Credits this month
            </p>

            <div className="flex items-center gap-12">

              {/* Circular indicator */}
              <div className="flex-shrink-0">
                <svg
                  viewBox="0 0 128 128"
                  className="w-44 h-44"
                  aria-label={`${CREDITS_USED} of ${CREDITS_TOTAL} credits used`}
                >
                  <defs>
                    <linearGradient id="usage-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>

                  {/* Track */}
                  <circle
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke="#e7e5e4"
                    strokeWidth="10"
                  />

                  {/* Progress arc */}
                  <circle
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke="url(#usage-gradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={progressOffset}
                    transform={`rotate(-90 ${CX} ${CY})`}
                  />

                  {/* Center: number */}
                  <text
                    x={CX} y="57"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="800"
                    fill="#111827"
                  >
                    {CREDITS_USED}
                  </text>

                  {/* Center: of total */}
                  <text
                    x={CX} y="73"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#a8a29e"
                  >
                    of {CREDITS_TOTAL}
                  </text>

                  {/* Center: label */}
                  <text
                    x={CX} y="88"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#c4b5a5"
                    letterSpacing="0.4"
                  >
                    credits used
                  </text>
                </svg>
              </div>

              {/* Supporting numbers — no cards, just clean type */}
              <div className="flex flex-col gap-5 flex-1">
                <div>
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
                    Remaining
                  </p>
                  <p className="text-4xl font-black text-gray-900 leading-none">
                    {CREDITS_REMAINING}
                  </p>
                </div>

                <div className="h-px bg-stone-100" />

                <div className="flex gap-8">
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
                      Used
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{CREDITS_USED}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-stone-300">{CREDITS_TOTAL}</p>
                  </div>
                </div>

                <button className="self-start text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                  Top up credits
                </button>
              </div>

            </div>
          </section>

          {/* ── Breakdown by category ── */}
          <section className="mb-10">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5">
              Breakdown by category
            </p>

            <div className="flex flex-col gap-5">
              {breakdown.map((item) => {
                const pct = Math.round((item.credits / CREDITS_USED) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm leading-none">{item.emoji}</span>
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-400">{pct}%</span>
                        <span className="text-sm font-semibold text-gray-900 w-14 text-right">
                          {item.credits} <span className="text-stone-400 font-normal text-xs">cr</span>
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full">
                      <div
                        className={`h-2 rounded-full ${item.bar} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Activity ── */}
          <section>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5">
              Activity
            </p>

            <div className="flex flex-col gap-5 mb-6">
              {history.map((item) => {
                const pct = Math.round((item.credits / historyMax) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.credits} <span className="text-stone-400 font-normal text-xs">credits</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full">
                      <div
                        className="h-2 bg-stone-300 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insight */}
            <div className="flex items-center gap-2 pt-5 border-t border-stone-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <p className="text-xs text-stone-400">
                Most usage comes from shipping-related questions.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
