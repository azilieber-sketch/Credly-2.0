"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CREDITS_TOTAL     = 2000;
const CREDITS_USED      = 347;
const CREDITS_REMAINING = CREDITS_TOTAL - CREDITS_USED;

const BREAKDOWN = [
  { label: "Shipping",  credits: 180, color: "bg-indigo-400" },
  { label: "Returns",   credits: 92,  color: "bg-violet-400" },
  { label: "Inquiries", credits: 75,  color: "bg-sky-400"    },
];

const RECENT_INVOICES = [
  { id: "INV-0024", date: "May 1, 2026",  credits: 2000, amount: "$149.00", status: "paid"    },
  { id: "INV-0023", date: "Apr 1, 2026",  credits: 500,  amount: "$49.00",  status: "paid"    },
  { id: "INV-0022", date: "Mar 1, 2026",  credits: 2000, amount: "$149.00", status: "paid"    },
];

const STATS = [
  { label: "Credits used",  value: CREDITS_USED.toString(),                  sub: "This month"    },
  { label: "Avg per day",   value: (CREDITS_USED / 31).toFixed(1),           sub: "May 2026"      },
  { label: "Days to reset", value: "23",                                      sub: "Resets Jun 1"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setDisplayName(email.split("@")[0]);
  }, []);

  const creditPct = Math.round((CREDITS_USED / CREDITS_TOTAL) * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">

      {/* ── Header ── */}
      <div className="mb-10">
        {displayName && (
          <p className="text-sm text-stone-400 mb-1">{greeting}, {displayName}.</p>
        )}
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Dashboard
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Credit balance · May 2026
        </h1>
        <p className="text-stone-400 mt-2 text-sm">
          {CREDITS_REMAINING.toLocaleString()} of {CREDITS_TOTAL.toLocaleString()} credits remaining.
        </p>
      </div>

      {/* ── Credits card ── */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-4xl font-black text-gray-900 leading-none tabular-nums">
                {CREDITS_REMAINING.toLocaleString()}
                <span className="text-base font-semibold text-stone-400 ml-2">remaining</span>
              </p>
              <p className="text-sm text-stone-400 mt-1.5">
                {CREDITS_USED} credits used this month
              </p>
            </div>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
              Top up
            </button>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-1.5 mb-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all"
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">{creditPct}% of {CREDITS_TOTAL.toLocaleString()} used</p>
            <p className="text-xs font-medium text-emerald-500">On track</p>
          </div>
        </div>
      </section>

      {/* ── Stats row ── */}
      <section className="mb-8">
        <div className="grid grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
                {s.label}
              </p>
              <p className="text-3xl font-black text-gray-900 leading-none tabular-nums mb-1">
                {s.value}
              </p>
              <p className="text-xs text-stone-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Usage breakdown ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Usage breakdown
          </p>
          <Link href="/usage" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Full report →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-6 py-5 flex flex-col gap-4">
          {BREAKDOWN.map((item) => {
            const pct = Math.round((item.credits / CREDITS_USED) * 100);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">{pct}%</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums w-14 text-right">
                      {item.credits} <span className="text-stone-400 font-normal text-xs">cr</span>
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${item.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recent invoices ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Recent invoices
          </p>
          <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Credits</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_INVOICES.map((inv, i) => (
                <tr
                  key={inv.id}
                  className={`hover:bg-stone-50/60 transition-colors ${i < RECENT_INVOICES.length - 1 ? "border-b border-stone-100" : ""}`}
                >
                  <td className="px-5 py-3.5 text-sm font-mono font-medium text-gray-900">{inv.id}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500">{inv.date}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{inv.credits.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{inv.amount}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
