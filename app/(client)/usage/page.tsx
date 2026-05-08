"use client";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CREDITS_TOTAL     = 2000;
const CREDITS_USED      = 347;
const CREDITS_REMAINING = CREDITS_TOTAL - CREDITS_USED;

const BREAKDOWN = [
  { emoji: "📦", label: "Shipping",  credits: 180, bar: "bg-indigo-400" },
  { emoji: "🔁", label: "Returns",   credits: 92,  bar: "bg-violet-400" },
  { emoji: "💬", label: "Inquiries", credits: 75,  bar: "bg-sky-400"    },
];

const HISTORY = [
  { label: "Today",     credits: 12 },
  { label: "This week", credits: 48 },
];

// ─── SVG circle constants ─────────────────────────────────────────────────────

const R            = 52;
const CX           = 64;
const CY           = 64;
const CIRCUMFERENCE = 2 * Math.PI * R;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsagePage() {
  const progressOffset = CIRCUMFERENCE * (1 - CREDITS_USED / CREDITS_TOTAL);
  const historyMax     = Math.max(...HISTORY.map((h) => h.credits));

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">

      {/* ── Header ── */}
      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Usage
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Track how your credits<br />are being used.
        </h1>
        <p className="text-stone-400 mt-2 text-sm leading-relaxed">
          A live view of your credit consumption this month.
        </p>
      </div>

      {/* ── Credits this month ── */}
      <section className="mb-10">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-6">
          Credits this month
        </p>

        <div className="flex items-center gap-12">

          {/* Circular indicator */}
          <div className="flex-shrink-0">
            <svg
              viewBox="0 0 128 128"
              className="w-44 h-44"
              aria-label={`${CREDITS_USED} of ${CREDITS_TOTAL} credits used`}
            >
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
                {CREDITS_USED}
              </text>
              <text x={CX} y="73" textAnchor="middle" fontSize="11" fill="#a8a29e">
                of {CREDITS_TOTAL}
              </text>
              <text x={CX} y="88" textAnchor="middle" fontSize="9" fill="#c4b5a5" letterSpacing="0.4">
                credits used
              </text>
            </svg>
          </div>

          {/* Supporting numbers */}
          <div className="flex flex-col gap-5 flex-1">
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Remaining</p>
              <p className="text-4xl font-black text-gray-900 leading-none tabular-nums">{CREDITS_REMAINING}</p>
            </div>

            <div className="h-px bg-stone-100" />

            <div className="flex gap-8">
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Used</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{CREDITS_USED}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-2xl font-bold text-stone-300 tabular-nums">{CREDITS_TOTAL}</p>
              </div>
            </div>

            <button className="self-start text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
              Top up credits
            </button>
          </div>

        </div>
      </section>

      {/* ── Breakdown by category ── */}
      <section className="mb-10">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5">
          Breakdown by category
        </p>

        <div className="flex flex-col gap-5">
          {BREAKDOWN.map((item) => {
            const pct = Math.round((item.credits / CREDITS_USED) * 100);
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
                  <div
                    className={`h-1.5 rounded-full ${item.bar} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
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
          {HISTORY.map((item) => {
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
                  <div
                    className="h-1.5 bg-stone-300 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
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
