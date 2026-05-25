"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/_lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  email: string;
}

interface Integration {
  company_id: string;
  channel: string;
  status: "connected" | "disconnected";
}

// ── Config ────────────────────────────────────────────────────────────────────

const CHANNELS = ["gmail", "slack", "hubspot", "instagram"] as const;
type Channel = typeof CHANNELS[number];

const CHANNEL_LABEL: Record<Channel, string> = {
  gmail:     "Gmail",
  slack:     "Slack",
  hubspot:   "HubSpot",
  instagram: "Instagram",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminIntegrationsPage() {
  const [companies,     setCompanies]     = useState<Company[]>([]);
  const [integrations,  setIntegrations]  = useState<Integration[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    Promise.all([
      supabase.from("companies").select("id, name, email").order("name"),
      supabase.from("integrations").select("company_id, channel, status"),
    ]).then(([coRes, intRes]) => {
      if (coRes.data)  setCompanies(coRes.data as Company[]);
      if (intRes.data) setIntegrations(intRes.data as Integration[]);
      setLoading(false);
    });
  }, []);

  const isConnected = (companyId: string, channel: Channel) =>
    integrations.some(
      (i) => i.company_id === companyId && i.channel === channel && i.status === "connected"
    );

  const connectionCount = (companyId: string) =>
    CHANNELS.filter((ch) => isConnected(companyId, ch)).length;

  const totalConnections = companies.reduce((n, co) => n + connectionCount(co.id), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* ── Header ── */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Integrations</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {companies.length} companies · {totalConnections} active connection{totalConnections !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No companies found.</div>
        ) : (
          <>
            {/* Desktop */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Company
                  </th>
                  {CHANNELS.map((ch) => (
                    <th key={ch} className="px-4 py-3 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {CHANNEL_LABEL[ch]}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((co, i) => {
                  const count = connectionCount(co.id);
                  return (
                    <tr
                      key={co.id}
                      className={`hover:bg-zinc-50 transition-colors ${i < companies.length - 1 ? "border-b border-zinc-100" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/companies/${co.id}`} className="group">
                          <p className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                            {co.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{co.email}</p>
                        </Link>
                      </td>
                      {CHANNELS.map((ch) => (
                        <td key={ch} className="px-4 py-3.5 text-center">
                          {isConnected(co.id, ch) ? (
                            <span
                              title="Connected"
                              className="inline-block w-2 h-2 rounded-full bg-emerald-400"
                            />
                          ) : (
                            <span className="text-zinc-200 text-base leading-none">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          count > 0 ? "bg-indigo-50 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                        }`}>
                          {count} / {CHANNELS.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {companies.map((co) => {
                const count = connectionCount(co.id);
                return (
                  <div key={co.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{co.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">{co.email}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-3 ${
                        count > 0 ? "bg-indigo-50 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        {count}/{CHANNELS.length}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {CHANNELS.map((ch) => (
                        <span
                          key={ch}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                            isConnected(co.id, ch)
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {isConnected(co.id, ch) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          )}
                          {CHANNEL_LABEL[ch]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
