"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopUpModal from "@/app/_components/TopUpModal";
import { getClient, ClientData, DEFAULT_CLIENT } from "@/app/_lib/store";

const BREAKDOWN_RATIOS = [
  { label: "Shipping",  ratio: 0.52, color: "bg-indigo-400" },
  { label: "Returns",   ratio: 0.27, color: "bg-violet-400" },
  { label: "Inquiries", ratio: 0.21, color: "bg-sky-400"    },
];

export default function DashboardPage() {
  const [client, setClient]       = useState<ClientData>(DEFAULT_CLIENT);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const load = () => {
    const data = getClient();
    setClient(data);
    const email = localStorage.getItem("userEmail") ?? "";
    setDisplayName(data.name || (email ? email.split("@")[0] : null));
  };

  useEffect(() => { load(); }, []);

  const { creditsTotal, creditsUsed, invoices } = client;
  const creditsRemaining = creditsTotal - creditsUsed;
  const creditPct = Math.min(100, Math.round((creditsUsed / creditsTotal) * 100));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const breakdown = BREAKDOWN_RATIOS.map((b) => ({
    ...b,
    credits: Math.round(creditsUsed * b.ratio),
  }));

  const recentInvoices = invoices.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} onSuccess={load} />}

      {/* ── Header ── */}
      <div className="mb-7 md:mb-10">
        {displayName && (
          <p className="text-sm text-stone-400 mb-1">{greeting}, {displayName}.</p>
        )}
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Dashboard
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Credit balance · May 2026
        </h1>
        <p className="text-stone-400 mt-2 text-sm">
          {creditsRemaining.toLocaleString()} of {creditsTotal.toLocaleString()} credits remaining.
        </p>
      </div>

      {/* ── Credits card ── */}
      <section className="mb-5">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-gray-900 leading-none tabular-nums">
                {creditsRemaining.toLocaleString()}
                <span className="text-sm sm:text-base font-semibold text-stone-400 ml-2">remaining</span>
              </p>
              <p className="text-sm text-stone-400 mt-1.5">{creditsUsed} credits used this month</p>
            </div>
            <button
              onClick={() => setTopUpOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              Top up
            </button>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 mb-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">{creditPct}% of {creditsTotal.toLocaleString()} used</p>
            <p className="text-xs font-medium text-emerald-500">On track</p>
          </div>
        </div>
      </section>

      {/* ── Stats row ── */}
      <section className="mb-6 md:mb-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Credits used",  value: creditsUsed.toString(),        sub: "This month"   },
            { label: "Avg per day",   value: (creditsUsed / 31).toFixed(1), sub: "May 2026"     },
            { label: "Days to reset", value: "23",                           sub: "Resets Jun 1" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-100 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 sm:mb-3">{s.label}</p>
              <p className="text-xl sm:text-3xl font-black text-gray-900 leading-none tabular-nums mb-1">{s.value}</p>
              <p className="text-xs text-stone-400 hidden sm:block">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Usage breakdown ── */}
      <section className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Usage breakdown</p>
          <Link href="/usage" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Full report →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-5 flex flex-col gap-4">
          {breakdown.map((item) => {
            const pct = creditsUsed > 0 ? Math.round((item.credits / creditsUsed) * 100) : 0;
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
                  <div className={`h-1.5 rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recent invoices ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Recent invoices</p>
          <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {recentInvoices.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No invoices yet.</div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="w-full hidden sm:table">
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
                  {recentInvoices.map((inv, i) => (
                    <tr key={inv.id} className={`hover:bg-stone-50/60 transition-colors ${i < recentInvoices.length - 1 ? "border-b border-stone-100" : ""}`}>
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

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-stone-100">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="px-4 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono font-medium text-gray-900">{inv.id}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{inv.date} · {inv.credits.toLocaleString()} cr</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{inv.amount}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
