"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/_lib/supabase";
import SourceIcon from "./SourceIcon";

interface NotifTicket {
  id: string;
  company_name: string;
  description: string;
  source: string | null;
  created_at: string;
  company_id: string | null;
}

const LAST_SEEN_KEY = "admin_notif_last_seen";

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function NotificationBell() {
  const router  = useRouter();
  const [tickets, setTickets] = useState<NotifTicket[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [open,    setOpen]    = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("tickets")
      .select("id, company_name, description, source, created_at, company_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!data) return;
    setTickets(data as NotifTicket[]);
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    const count = lastSeen
      ? data.filter((t) => new Date(t.created_at) > new Date(lastSeen)).length
      : data.length;
    setUnread(count);
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return;
    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tickets" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setUnread(0);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        aria-label="Notifications"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">Recent tickets</p>
            <button
              onClick={() => { router.push("/admin/tickets"); setOpen(false); }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all →
            </button>
          </div>
          {tickets.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-400">No tickets yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => { router.push(ticket.company_id ? `/admin/companies/${ticket.company_id}` : "/admin/tickets"); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <SourceIcon source={ticket.source} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{ticket.company_name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{ticket.description}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{timeAgo(ticket.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
