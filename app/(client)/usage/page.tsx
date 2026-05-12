"use client";

import { useEffect, useState } from "react";
import TopUpModal from "@/app/_components/TopUpModal";
import { getClient, ClientData, DEFAULT_CLIENT } from "@/app/_lib/store";

const R             = 52;
const CX            = 64;
const CY            = 64;
const CIRCUMFERENCE = 2 * Math.PI * R;

const BREAKDOWN_RATIOS = [
  { emoji: "📦", label: "Shipping",  ratio: 0.52, bar: "bg-indigo-400" },
  { emoji: "🔁", label: "Returns",   ratio: 0.27, bar: "bg-violet-400" },
  { emoji: "💬", label: "Inquiries", ratio: 0.21, bar: "bg-sky-400"    },
];

export default function UsagePage() {
  const [client, setClient]       = useState<ClientData>(DEFAULT_CLIENT);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const load = () => setClient(getClient());
  useEffect(() => { load(); }, []);

  const { creditsTotal, creditsUsed } = client;
  const creditsRemaining = creditsTotal - creditsUsed;
  const progressOffset   = CIRCUMFERENCE * (1 - Math.min(creditsUsed / creditsTotal, 1));

  const breakdown = BREAKDOWN_RATIOS.map((b) => ({
    ...b,
    credits: Math.round(creditsUsed * b.ratio),
  }));

  const historyItems = [
    { label: "Today",     credits: Math.round(creditsUsed * 0.035) },
    { label: "This week", credits: Math.round(creditsUsed * 0.138) },
  ];
  const historyMax = Math.max(...historyItems.map((h) => h.credits), 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} onSuccess={load} />}

      {/* ── Header ── */}
      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Usage
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Track how your credits<br className="hidden sm:block" /> are being used.
        </h1>
        <p className="text-stone-400 mt-2 text-sm leading-relaxed">
          A live view of your credit consumption this month.
        </p>
      </div>

      {/* ── Credits this month ── */}
      <section className="mb-8 md:mb-10">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5 md:mb-6">
          Credits this month
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
          <div className="flex-shrink-0">
            <svg viewBox="0 0 128 128" className="w-36 h-36 sm:w-44 sm:h-44" aria-label={`${creditsUsed} of ${creditsTotal} credits used`}>
              <defs>
                <linearGradient id="usage-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e7e5e4" strokeWidth="10" />
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
              <text x={CX} y="57" textAnchor="middle" fontSize="28" fontWeight="800" fill="#111827">
                {creditsUsed}
              </text>
              <text x={CX} y="73" textAnchor="middle" fontSize="11" fill="#a8a29e">
                of {creditsTotal}
              </text>
              <text x={CX} y="88" textAnchor="middle" fontSize="9" fill="#c4b5a5" letterSpacing="0.4">
                credits used
              </text>
            </svg>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 w-full sm:flex-1">
            <div className="flex items-center justify-between sm:block">
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Remaining</p>
                <p className="text-3xl sm:text-4xl font-black text-gray-900 leading-none tabular-nums">{creditsRemaining.toLocaleString()}</p>
              </div>
              <button
                onClick={() => setTopUpOpen(true)}
                className="sm:hidden text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg transition-colors"
              >
                Top up
              </button>
            </div>
            <div className="h-px bg-stone-100" />
            <div className="flex gap-6 sm:gap-8">
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Used</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">{creditsUsed}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-stone-300 tabular-nums">{creditsTotal}</p>
              </div>
            </div>
            <button
              onClick={() => setTopUpOpen(true)}
              className="hidden sm:inline-flex self-start text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Top up credits
            </button>
          </div>
        </div>
      </section>

      {/* ── Breakdown by category ── */}
      <section className="mb-8 md:mb-10">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5">
          Breakdown by category
        </p>
        <div className="flex flex-col gap-5">
          {breakdown.map((item) => {
            const pct = creditsUsed > 0 ? Math.round((item.credits / creditsUsed) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none">{item.emoji}</span>
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">{pct}%</span>
                    <span className="text-sm font-semibold text-gray-900 w-14 text-right tabular-nums">
                      {item.credits} <span className="text-stone-400 font-normal text-xs">cr</span>
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full">
                  <div className={`h-1.5 rounded-full ${item.bar} transition-all`} style={{ width: `${pct}%` }} />
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
          {historyItems.map((item) => {
            const pct = Math.round((item.credits / historyMax) * 100);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {item.credits} <span className="text-stone-400 font-normal text-xs">credits</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full">
                  <div className="h-1.5 bg-stone-300 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-5 border-t border-stone-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-xs text-stone-400">Most usage comes from shipping-related questions.</p>
        </div>
      </section>
    </div>
  );
}
