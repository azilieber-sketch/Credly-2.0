"use client";

import Link from "next/link";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLATFORM_METRICS = [
  { label: "Total companies",   value: "12",      sub: "+2 this month"     },
  { label: "Credits issued",    value: "38,500",  sub: "All time"          },
  { label: "Active this month", value: "8",       sub: "of 12 companies"   },
  { label: "Revenue MTD",       value: "$1,792",  sub: "May 2026"          },
];

const COMPANIES = [
  { name: "Lumina Apparel",   credits: 2000, used: 580, plan: "Growth",  status: "active"   },
  { name: "Petal & Oak",      credits: 500,  used: 312, plan: "Starter", status: "active"   },
  { name: "Dusk Goods Co.",   credits: 2000, used: 95,  plan: "Growth",  status: "active"   },
  { name: "Reef Supply",      credits: 500,  used: 500, plan: "Starter", status: "depleted" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      {/* ── Header ── */}
      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Admin Dashboard
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Platform overview</h1>
        <p className="text-stone-400 mt-2 text-sm">All companies, credit allocations, and activity.</p>
      </div>

      {/* ── Platform metrics ── */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Platform</p>
        <div className="grid grid-cols-4 gap-4">
          {PLATFORM_METRICS.map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">{m.label}</p>
              <p className="text-3xl font-black text-gray-900 leading-none tabular-nums mb-1">{m.value}</p>
              <p className="text-xs text-stone-400">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Companies ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Companies</p>
          <Link href="/admin/companies" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Credits used</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((co, i) => {
                const pct = Math.round((co.used / co.credits) * 100);
                const isDepleted = co.status === "depleted";
                return (
                  <tr
                    key={co.name}
                    className={`hover:bg-stone-50/60 transition-colors ${i < COMPANIES.length - 1 ? "border-b border-stone-100" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{co.name}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500">{co.plan}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {co.used} <span className="text-stone-400 font-normal text-xs">/ {co.credits}</span>
                        </span>
                        <div className="w-16 h-1 bg-stone-100 rounded-full">
                          <div
                            className={`h-1 rounded-full ${isDepleted ? "bg-red-400" : "bg-indigo-400"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{co.credits}</td>
                    <td className="px-5 py-3.5 text-right">
                      {isDepleted ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          Depleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
