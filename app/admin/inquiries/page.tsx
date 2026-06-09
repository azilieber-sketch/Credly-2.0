"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/_lib/supabase";

function convertHref(q: { id: string; email: string }) {
  return `/admin/companies?convert=1&email=${encodeURIComponent(q.email)}&inquiry_id=${q.id}`;
}

interface Inquiry {
  id: string;
  email: string;
  message: string | null;
  status: "new" | "contacted";
  created_at: string;
}

type StatusFilter = "all" | "new" | "contacted";

const STATUS_BADGE: Record<Inquiry["status"], string> = {
  new:       "bg-indigo-50 text-indigo-700",
  contacted: "bg-emerald-50 text-emerald-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter,    setFilter]    = useState<StatusFilter>("all");
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInquiries(data as Inquiry[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Inquiry["status"]) => {
    if (!supabase) return;
    setBusy(id);
    await supabase.from("inquiries").update({ status }).eq("id", id);
    setInquiries((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    setBusy(null);
  };

  if (!supabase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Supabase not configured</p>
          <p className="text-sm text-zinc-400">Add your Supabase environment variables to view inquiries.</p>
        </div>
      </div>
    );
  }

  const newCount = inquiries.filter((q) => q.status === "new").length;
  const visible  = inquiries.filter((q) => filter === "all" || q.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Inquiries</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {inquiries.length} total
            {newCount > 0 && (
              <span className="text-indigo-600 font-medium"> · {newCount} new</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-5 overflow-x-auto pb-0.5">
        {(["all", "new", "contacted"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-2 rounded-lg font-medium capitalize transition-all flex-shrink-0 ${
              filter === f ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No inquiries yet.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Message</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((q, i) => (
                  <tr key={q.id} className={i < visible.length - 1 ? "border-b border-zinc-100" : ""}>
                    <td className="px-5 py-3.5 align-top">
                      <p className="text-sm font-semibold text-zinc-900 break-all">{q.email}</p>
                    </td>
                    <td className="px-5 py-3.5 align-top max-w-xs">
                      <p className="text-sm text-zinc-500 whitespace-pre-wrap break-words">
                        {q.message || <span className="text-zinc-300">—</span>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 align-top text-sm text-zinc-500 whitespace-nowrap">{formatDate(q.created_at)}</td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={convertHref(q)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors whitespace-nowrap"
                        >
                          Convert to client →
                        </Link>
                        {q.status === "new" ? (
                          <button
                            onClick={() => setStatus(q.id, "contacted")}
                            disabled={busy === q.id}
                            className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            {busy === q.id ? "…" : "Mark contacted"}
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatus(q.id, "new")}
                            disabled={busy === q.id}
                            className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {visible.map((q) => (
                <div key={q.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-zinc-900 break-all min-w-0">{q.email}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${STATUS_BADGE[q.status]}`}>
                      {q.status}
                    </span>
                  </div>
                  {q.message && (
                    <p className="text-sm text-zinc-500 whitespace-pre-wrap break-words mb-2">{q.message}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-zinc-400">{formatDate(q.created_at)}</p>
                    <div className="flex items-center gap-3">
                      {q.status === "new" ? (
                        <button
                          onClick={() => setStatus(q.id, "contacted")}
                          disabled={busy === q.id}
                          className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
                        >
                          {busy === q.id ? "…" : "Mark contacted"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(q.id, "new")}
                          disabled={busy === q.id}
                          className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
                        >
                          Undo
                        </button>
                      )}
                      <Link
                        href={convertHref(q)}
                        className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Convert
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
