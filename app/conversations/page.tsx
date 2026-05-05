"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status   = "resolved" | "pending" | "escalated";
type Category = "order" | "refund" | "chat" | "return" | "alert";
type Filter   = "all" | Status;

interface Message {
  role: "customer" | "ai";
  text: string;
  time: string;
}

interface Conversation {
  id: number;
  customer: string;
  preview: string;
  status: Status;
  category: Category;
  time: string;
  credits: number;
  duration: string;
  messages: Message[];
}

// ─── Static data ──────────────────────────────────────────────────────────────

const CONVOS: Conversation[] = [
  {
    id: 1,
    customer: "John D.",
    preview: "Where is my order? I placed it 5 days ago and haven't received any updates.",
    status: "resolved",
    category: "order",
    time: "2m ago",
    credits: 1.8,
    duration: "1 min",
    messages: [
      { role: "customer", text: "Where is my order? I placed it 5 days ago and haven't received any updates.", time: "10:14 AM" },
      { role: "ai",       text: "Hi John! I've looked up your order — it's currently out for delivery and should arrive today before 8 PM.", time: "10:14 AM" },
      { role: "customer", text: "That's great, thank you!", time: "10:15 AM" },
      { role: "ai",       text: "Of course! Is there anything else I can help you with?", time: "10:15 AM" },
    ],
  },
  {
    id: 2,
    customer: "Sarah M.",
    preview: "I want to return my jacket, it doesn't fit properly.",
    status: "pending",
    category: "return",
    time: "8m ago",
    credits: 2.1,
    duration: "2 min",
    messages: [
      { role: "customer", text: "I want to return my jacket, it doesn't fit properly.", time: "10:06 AM" },
      { role: "ai",       text: "I'm sorry to hear that! I can initiate a return for you. Could you confirm your order number?", time: "10:07 AM" },
      { role: "customer", text: "It's #ORD-4821.", time: "10:07 AM" },
      { role: "ai",       text: "Thank you! I've started the return. You'll receive a prepaid label within 24 hours. A replacement will ship once we receive the item.", time: "10:08 AM" },
    ],
  },
  {
    id: 3,
    customer: "Marcus T.",
    preview: "I was charged twice for the same order. This is completely unacceptable.",
    status: "escalated",
    category: "alert",
    time: "34m ago",
    credits: 3.4,
    duration: "3 min",
    messages: [
      { role: "customer", text: "I was charged twice for the same order. This is completely unacceptable.", time: "9:40 AM" },
      { role: "ai",       text: "I sincerely apologize. I can see a duplicate charge on your account and am looking into it now.", time: "9:41 AM" },
      { role: "customer", text: "Please fix this. I need my money back.", time: "9:42 AM" },
      { role: "ai",       text: "I've escalated this to our billing team for urgent review. You'll hear back within 2 hours. I'm sorry for the frustration.", time: "9:43 AM" },
    ],
  },
  {
    id: 4,
    customer: "Priya K.",
    preview: "Does your store ship internationally? I'm in Canada.",
    status: "resolved",
    category: "chat",
    time: "1h ago",
    credits: 0.9,
    duration: "1 min",
    messages: [
      { role: "customer", text: "Does your store ship internationally? I'm in Canada.", time: "9:05 AM" },
      { role: "ai",       text: "Yes! We ship to Canada. Standard shipping (7–10 days) is $12.99. Express (3–5 days) is $24.99.", time: "9:05 AM" },
      { role: "customer", text: "Perfect, thank you!", time: "9:06 AM" },
      { role: "ai",       text: "Happy to help. Let us know if you have any other questions!", time: "9:06 AM" },
    ],
  },
  {
    id: 5,
    customer: "James L.",
    preview: "My refund hasn't arrived after 10 days. I returned the item ages ago.",
    status: "pending",
    category: "refund",
    time: "2h ago",
    credits: 1.5,
    duration: "2 min",
    messages: [
      { role: "customer", text: "My refund hasn't arrived after 10 days. I returned the item ages ago.", time: "8:30 AM" },
      { role: "ai",       text: "I apologize for the delay. Your return was received on April 25th. Refunds typically take 5–7 business days.", time: "8:31 AM" },
      { role: "customer", text: "It's been longer than that.", time: "8:31 AM" },
      { role: "ai",       text: "You're right — this has exceeded our standard timeframe. I've flagged it for priority review. You should see the refund within 24–48 hours.", time: "8:32 AM" },
    ],
  },
];

// ─── Maps ─────────────────────────────────────────────────────────────────────

const categoryIcon: Record<Category, { emoji: string; bg: string }> = {
  order:  { emoji: "📦", bg: "bg-indigo-50" },
  refund: { emoji: "🔁", bg: "bg-emerald-50" },
  chat:   { emoji: "💬", bg: "bg-sky-50" },
  return: { emoji: "🔁", bg: "bg-violet-50" },
  alert:  { emoji: "⚠️", bg: "bg-red-50" },
};

const statusConfig: Record<Status, { text: string; cls: string }> = {
  resolved:  { text: "Resolved",  cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  pending:   { text: "Pending",   cls: "bg-amber-50 text-amber-600 border-amber-100" },
  escalated: { text: "Escalated", cls: "bg-red-50 text-red-600 border-red-100" },
};

const categoryLabel: Record<Category, string> = {
  order:  "Shipping",
  refund: "Refund",
  chat:   "Inquiry",
  return: "Return",
  alert:  "Escalation",
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "pending",   label: "Pending" },
  { id: "resolved",  label: "Resolved" },
  { id: "escalated", label: "Escalated" },
];

// ─── Sidebar nav (matches dashboard) ──────────────────────────────────────────

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

export default function ConversationsPage() {
  const router = useRouter();
  const [email, setEmail]         = useState<string | null>(null);
  const [ready, setReady]         = useState(false);
  const [filter, setFilter]         = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number>(CONVOS[0].id);
  const [takenOver, setTakenOver]   = useState(false);

  const selectConvo = (id: number) => {
    setSelectedId(id);
    setTakenOver(false);
  };

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

  const filtered = filter === "all" ? CONVOS : CONVOS.filter((c) => c.status === filter);
  const selected = CONVOS.find((c) => c.id === selectedId) ?? CONVOS[0];

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
            const isActive = item.id === "conversations";
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "dashboard") router.push("/dashboard");
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

      {/* ── Two-panel content area ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: list ───────────────────────────────────────────── */}
        <div className="w-80 bg-white border-r border-stone-200/60 flex flex-col flex-shrink-0 overflow-hidden">

          {/* Panel header + filters */}
          <div className="px-4 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
            <h2 className="text-base font-bold text-gray-900 mb-3">Conversations</h2>
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
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

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-stone-400">No conversations</p>
              </div>
            ) : (
              filtered.map((convo) => {
                const icon    = categoryIcon[convo.category];
                const badge   = statusConfig[convo.status];
                const isActive = selectedId === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => selectConvo(convo.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-stone-100 transition-colors ${
                      isActive ? "bg-indigo-50/50" : "hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${icon.bg}`}>
                        <span className="text-sm leading-none">{icon.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-semibold leading-snug truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
                            {convo.customer}
                          </p>
                          <span className="text-[11px] text-stone-300 flex-shrink-0 ml-2">{convo.time}</span>
                        </div>
                        <p className="text-xs text-stone-400 leading-snug truncate mb-2">{convo.preview}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: detail ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Detail header */}
          <div className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryIcon[selected.category].bg}`}>
                <span className="text-base leading-none">{categoryIcon[selected.category].emoji}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-gray-900">{selected.customer}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig[selected.status].cls}`}>
                    {statusConfig[selected.status].text}
                  </span>
                </div>
                <p className={`text-[11px] font-medium ${takenOver ? "text-emerald-500" : "text-stone-400"}`}>
                  {takenOver ? "You are handling this" : "Handled by AI"}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {takenOver ? (
                <button
                  onClick={() => setTakenOver(false)}
                  className="text-xs font-medium text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 hover:text-stone-700 transition-all"
                >
                  Hand back to AI
                </button>
              ) : (
                <button
                  onClick={() => setTakenOver(true)}
                  className="text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
                >
                  Take over
                </button>
              )}
            </div>
          </div>

          {/* Conversation summary row */}
          <div className="bg-white border-b border-stone-100 px-6 py-2.5 flex items-center gap-2 text-xs text-stone-400 flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="leading-none">{categoryIcon[selected.category].emoji}</span>
              <span className="font-medium text-stone-500">{categoryLabel[selected.category]}</span>
            </span>
            <span className="text-stone-200">·</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded-full border text-[11px] ${statusConfig[selected.status].cls}`}>
              {statusConfig[selected.status].text}
            </span>
            <span className="text-stone-200">·</span>
            <span>{selected.credits.toFixed(1)} credits</span>
            <span className="text-stone-200">·</span>
            <span>{selected.duration}</span>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* "Today" divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Today</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <div className="flex flex-col gap-5">
              {selected.messages.map((msg, i) => {
                const isAI = msg.role === "ai";
                return (
                  <div key={i} className={`flex gap-2.5 ${isAI ? "flex-row-reverse" : "flex-row"}`}>

                    {/* Avatar */}
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                        isAI ? "bg-indigo-100 text-indigo-600" : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {isAI ? "AI" : selected.customer.charAt(0)}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col max-w-[68%] ${isAI ? "items-end" : "items-start"}`}>
                      <p className={`text-[11px] font-semibold mb-1 ${isAI ? "text-indigo-400" : "text-stone-400"}`}>
                        {isAI ? "AI Agent" : selected.customer}
                      </p>
                      <div
                        className={`text-sm leading-relaxed px-4 py-3 rounded-2xl ${
                          isAI
                            ? "bg-indigo-50 border border-indigo-100 text-stone-700 rounded-tr-sm"
                            : "bg-white border border-stone-150 text-stone-700 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p className="text-[10px] text-stone-300 mt-1">{msg.time}</p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
