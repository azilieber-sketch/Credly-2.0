"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/_lib/supabase";

type IssueCategory = "billing" | "technical" | "general";
type Priority = "low" | "medium" | "high";
type TicketStatus = "open" | "in-progress" | "resolved";

interface Ticket {
  id: string;
  company_name: string;
  email: string;
  issue_category: IssueCategory;
  priority: Priority;
  description: string;
  status: TicketStatus;
  created_at: string;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  open:          { label: "Open",        badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "in-progress": { label: "In Progress", badge: "bg-indigo-50 text-indigo-700",   dot: "bg-indigo-400"  },
  resolved:      { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; badge: string }> = {
  low:    { label: "Low",    badge: "bg-stone-50 text-stone-500" },
  medium: { label: "Medium", badge: "bg-amber-50 text-amber-600" },
  high:   { label: "High",   badge: "bg-red-50 text-red-600"     },
};

const EMPTY_FORM = {
  company_name: "",
  email: "",
  issue_category: "general" as IssueCategory,
  priority: "medium" as Priority,
  description: "",
};

type StatusFilter = TicketStatus | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",         label: "All"         },
  { id: "open",        label: "Open"        },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved"    },
];

export default function TicketsPage() {
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<StatusFilter>("all");
  const [loading,    setLoading]    = useState(true);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[tickets] submit fired, supabase:", supabase ? "ready" : "null");
    if (!supabase) return;
    setSubmitting(true);
    setError(null);

    console.log("[tickets] calling supabase insert...");
    const { data, error: dbError } = await supabase
      .from("tickets")
      .insert([form])
      .select()
      .single();
    console.log("[tickets] insert result — data:", data, "error:", dbError);

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.trim();
    console.log("[tickets] webhookUrl raw:", JSON.stringify(webhookUrl));
    console.log("[tickets] payload:", JSON.stringify(data));
    if (webhookUrl) {
      try {
        new URL(webhookUrl);
        console.log("[tickets] URL valid — calling fetch...");
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then(() => console.log("[tickets] webhook ok"))
          .catch((err: unknown) => console.error("[tickets] webhook promise rejected:", err));
      } catch (err) {
        console.error("[tickets] caught synchronous error:", err);
      }
    } else {
      console.log("[tickets] webhookUrl empty/missing — skipping fetch");
    }

    setTickets((prev) => [data as Ticket, ...prev]);
    setForm(EMPTY_FORM);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 4000);
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  if (!supabase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <div className="mb-7 md:mb-10">
          <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
            Support
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
            Support Tickets
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">Configuration required</p>
          <p className="text-sm text-stone-500">
            Add <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
            your Vercel environment variables, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">

      {/* ── Header ── */}
      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Support
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Support Tickets
        </h1>
        <p className="text-stone-400 mt-2 text-sm">
          Submit a request and track its progress below.
        </p>
      </div>

      {/* ── New ticket form ── */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6">
          <p className="text-sm font-semibold text-gray-900 mb-5">New ticket</p>

          {success && (
            <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
              Ticket submitted — you&apos;ll receive a confirmation email shortly.
            </div>
          )}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Company name</label>
                <input
                  required
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Category</label>
                <select
                  value={form.issue_category}
                  onChange={(e) => setForm((f) => ({ ...f, issue_category: e.target.value as IssueCategory }))}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Description</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                placeholder="Describe the issue in detail…"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit ticket"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Ticket list ── */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest flex-shrink-0">
            All tickets · {tickets.length}
          </p>
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                  filter === f.id
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                    : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400">
              {tickets.length === 0 ? "No tickets yet. Submit one above." : "No tickets match this filter."}
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filtered.map((ticket) => {
                const st = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                const pr = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;
                const date = new Date(ticket.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });
                return (
                  <div key={ticket.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ticket.company_name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{ticket.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pr.badge}`}>
                          {pr.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2 mb-2.5">{ticket.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded capitalize">
                        {ticket.issue_category}
                      </span>
                      <span className="text-[11px] text-stone-400">{date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
