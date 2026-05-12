"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivityLogs, ActivityLog, ActivityType, timeAgo, formatDate } from "@/app/_lib/store";

type Filter = "all" | ActivityType;

const TYPE_CONFIG: Record<ActivityType, { label: string; dot: string; badge: string }> = {
  credit_issued:      { label: "Credits",   dot: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700 border-indigo-100"   },
  company_added:      { label: "New co.",   dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  invoice_paid:       { label: "Payment",   dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  invoice_generated:  { label: "Invoice",   dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-100"       },
  plan_changed:       { label: "Plan",      dot: "bg-violet-500",  badge: "bg-violet-50 text-violet-700 border-violet-100"    },
  company_suspended:  { label: "Suspended", dot: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-100"             },
  company_activated:  { label: "Activated", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",               label: "All"        },
  { id: "credit_issued",     label: "Credits"    },
  { id: "invoice_paid",      label: "Payments"   },
  { id: "company_added",     label: "New cos."   },
  { id: "company_suspended", label: "Suspended"  },
  { id: "plan_changed",      label: "Plan changes" },
];

export default function ActivityPage() {
  const [logs, setLogs]     = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { setLogs(getActivityLogs()); }, []);

  const visible = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-zinc-900">Activity Logs</h1>
        <p className="text-sm text-zinc-400 mt-0.5">All platform events across companies and billing.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              filter === f.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No events found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Event</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log, i) => {
                const cfg = TYPE_CONFIG[log.type] ?? { label: log.type, dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600 border-zinc-200" };
                return (
                  <tr key={log.id} className={`hover:bg-zinc-50 transition-colors ${i < visible.length - 1 ? "border-b border-zinc-100" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <p className="text-sm text-zinc-700">{log.description}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {log.company ? (
                        <Link
                          href={log.companyId ? `/admin/companies/${log.companyId}` : "/admin/companies"}
                          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {log.company}
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {log.amount
                        ? <span className="text-sm font-semibold text-zinc-900">{log.amount}</span>
                        : <span className="text-sm text-zinc-300">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm text-zinc-400">{timeAgo(log.timestamp)}</p>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
