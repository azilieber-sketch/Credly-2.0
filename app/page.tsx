"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = { icon: React.ReactNode; title: string; desc: string };

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-5">
    {children}
  </span>
);

// ─── Auth Modal ───────────────────────────────────────────────────────────────

const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const login = (emailValue?: string) => {
    localStorage.setItem("isLoggedIn", "true");
    if (emailValue) localStorage.setItem("userEmail", emailValue);
    router.push("/dashboard");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-lg"
        >
          ×
        </button>

        <span className="text-base font-bold text-gray-900">Credly</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-5 mb-1">Get started</h2>
        <p className="text-stone-500 text-sm mb-7">Sign in or create your account in seconds.</p>

        <button
          onClick={() => login()}
          className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-2xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 active:scale-[0.98] transition-all mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 12.075 17.64 9.767 17.64 9.2z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9.009 9.009 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-stone-100" />
          <span className="text-xs text-stone-400 font-medium">or</span>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && login(email)}
            className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
          />
          <button
            onClick={() => email && login(email)}
            disabled={!email}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl px-4 py-3 text-sm hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Continue
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center mt-6 leading-relaxed">
          By continuing you agree to our{" "}
          <a href="#" className="underline hover:text-stone-600 transition-colors">Terms</a> and{" "}
          <a href="#" className="underline hover:text-stone-600 transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_IDS = ["home", "how-it-works", "features", "pricing", "faq"] as const;

const Navbar = ({ onAuth }: { onAuth: () => void }) => {
  const [active, setActive] = useState<string>("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    );
    NAV_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const linkClass = (id: string) =>
    `text-sm font-medium transition-colors ${
      active === id ? "text-indigo-600" : "text-stone-500 hover:text-stone-900"
    }`;

  return (
    <nav className="w-full px-8 py-5 flex items-center justify-between border-b border-stone-200/60 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <a href="#home" className="text-xl font-bold tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
        Credly
      </a>

      <div className="hidden md:flex items-center gap-8">
        <a href="#home"         className={linkClass("home")}>Home</a>
        <a href="#how-it-works" className={linkClass("how-it-works")}>How it works</a>
        <a href="#features"     className={linkClass("features")}>Features</a>
        <a href="#pricing"      className={linkClass("pricing")}>Pricing</a>
        <a href="#faq"          className={linkClass("faq")}>FAQ</a>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onAuth}
          className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          Sign in
        </button>
        <button
          onClick={onAuth}
          className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60"
        >
          Start free
        </button>
      </div>
    </nav>
  );
};

// ─── Hero visual ──────────────────────────────────────────────────────────────

const WorkflowPreview = () => (
  <div className="relative h-[520px] hidden lg:flex items-center justify-center">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-96 h-96 rounded-full bg-violet-100 opacity-25 blur-3xl" />
    </div>

    {/* Main workflow card */}
    <div className="relative z-10 bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-5 w-80">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-stone-500">Live queue</span>
        </div>
        <span className="text-[11px] text-stone-400 font-medium bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full">14 open</span>
      </div>

      {/* Customer message */}
      <div className="flex items-end gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-stone-500">S</div>
        <div className="bg-stone-100 rounded-2xl rounded-bl-none px-3 py-2 text-sm text-stone-700 leading-snug">
          Where is my order? It&apos;s been 3 days.
        </div>
      </div>

      {/* AI draft */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">AI draft</span>
        </div>
        <p className="text-sm text-stone-700 leading-snug">
          Hi Sarah! Your order shipped yesterday and arrives today by 6 PM.
        </p>
      </div>

      {/* Agent action row */}
      <div className="flex items-center gap-2">
        <button className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg">Send</button>
        <button className="text-xs font-medium text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg">Edit</button>
        <span className="text-[11px] text-stone-400 ml-auto">Reviewed in 6s</span>
      </div>
    </div>

    {/* Resolved badge */}
    <div className="absolute bottom-16 right-4 z-20 bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-100 px-4 py-3 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M13 4L6.5 11 3 7.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900">Resolved in 47s</p>
        <p className="text-[10px] text-stone-400">Agent approved · AI assisted</p>
      </div>
    </div>

    {/* Human control badge */}
    <div className="absolute top-12 right-8 z-20 bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-100 px-3 py-2.5 flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      </div>
      <p className="text-xs font-semibold text-gray-900">Human in control</p>
    </div>
  </div>
);

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero = ({ onAuth }: { onAuth: () => void }) => (
  <section id="home" className="relative bg-stone-50 overflow-hidden min-h-[calc(100vh-73px)] flex items-center px-8 py-20 lg:py-0">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.11),transparent)] pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_95%,rgba(251,191,36,0.09),transparent)] pointer-events-none" />

    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full w-fit border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Human-led · AI-powered
          </div>

          <h1 className="text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-gray-900 leading-[1.04]">
            Your support team,<br />
            <span className="text-indigo-600">built to scale.</span>
          </h1>

          <p className="text-lg text-stone-500 leading-relaxed max-w-lg">
            Credly gives customer support teams AI-powered workflows to resolve faster, escalate smarter, and deliver better experiences — without losing the human touch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAuth}
            className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-base font-semibold px-7 py-3.5 rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-300/30"
          >
            Start free
          </button>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center text-stone-600 text-base font-medium px-7 py-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all gap-2"
          >
            See how it works
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <WorkflowPreview />
    </div>
  </section>
);

// ─── Trust bar ────────────────────────────────────────────────────────────────

const TRUST_STATS = [
  { value: "3×",      label: "faster ticket resolution"     },
  { value: "68%",     label: "queries handled with AI"       },
  { value: "< 2 min", label: "average first response"        },
  { value: "100%",    label: "human oversight maintained"    },
];

const TrustBar = () => (
  <div className="bg-white border-y border-stone-200/60 px-8 py-6">
    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
      {TRUST_STATS.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-xl font-black text-gray-900 tabular-nums">{s.value}</span>
            <span className="text-sm text-stone-400 ml-2">{s.label}</span>
          </div>
          {i < TRUST_STATS.length - 1 && (
            <span className="hidden sm:block w-px h-5 bg-stone-200" />
          )}
        </div>
      ))}
    </div>
  </div>
);

// ─── Value props ──────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Move faster, without sacrificing quality",
    desc: "AI agents draft responses and surface relevant context instantly — giving your team everything they need to reply in seconds, not minutes.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Your team stays in command",
    desc: "Every AI suggestion is a starting point, not an endpoint. Agents review, edit, and approve every response. Full visibility, always.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    title: "Handle more without hiring more",
    desc: "Extend your team's capacity with AI that handles routine queries automatically, freeing your agents for complex, high-value conversations.",
  },
];

const ValueProps = () => (
  <section className="bg-stone-50 py-28 px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <SectionLabel>Why Credly</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          Built for teams, not to replace them.
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          AI that works alongside your people — accelerating operations while keeping humans at the centre of every customer relationship.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {VALUE_PROPS.map((v) => (
          <div
            key={v.title}
            className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5">
              {v.icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-3 leading-snug">{v.title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: "01",
    title: "Connect your support channels",
    desc: "Plug in email and chat in minutes. No complex setup, no developer required. Your existing workflows stay intact.",
  },
  {
    num: "02",
    title: "AI drafts, your team decides",
    desc: "AI agents surface context and suggest responses in real time. Your agents review and send in seconds — or take over the moment it matters.",
  },
  {
    num: "03",
    title: "Resolve faster, retain more",
    desc: "Customers get faster, more consistent responses. Your team handles more without burning out. Your brand stays exactly as you intend it.",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="relative bg-white py-28 px-8 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(99,102,241,0.04),transparent)] pointer-events-none" />
    <div className="max-w-7xl mx-auto relative">
      <div className="text-center mb-16">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          From setup to faster support<br />in three steps.
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          Credly fits into your existing operation — no rebuilding required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HOW_STEPS.map((s) => (
          <div
            key={s.num}
            className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="text-5xl font-black text-amber-100 leading-none">{s.num}</span>
            <h3 className="text-xl font-bold text-gray-900 mt-5 mb-2">{s.title}</h3>
            <p className="text-stone-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES: ServiceItem[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "AI response drafting",
    desc: "Instant draft responses based on conversation history and your knowledge base. Agents send in seconds.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Smart escalation routing",
    desc: "AI detects when a conversation needs human attention and routes it to the right team member instantly.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Full audit trail",
    desc: "Every interaction, AI suggestion, and agent action is logged. Full visibility for compliance and quality review.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
    title: "Credit-based billing",
    desc: "Pay per resolved conversation. No seats, no monthly minimums, no wasted budget when volume is low.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    title: "Usage & performance insights",
    desc: "Real-time dashboards showing ticket volume, response times, AI assist rates, and team performance.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: "Integrations",
    desc: "Shopify, Zendesk, and Gorgias connections to enrich AI context with order and customer data.",
    badge: "Coming soon",
  },
];

const Features = () => (
  <section id="features" className="bg-stone-50 py-28 px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <SectionLabel>Features</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          Everything your team needs<br />to operate at full capacity.
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          A complete support infrastructure — from AI drafting to billing to performance insights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-3xl p-7 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                {f.icon}
              </div>
              {"badge" in f && f.badge && (
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-stone-100 text-stone-400 px-2 py-0.5 rounded-md">
                  {f.badge}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS_DATA = [
  { value: "3×",      label: "More tickets handled",    sub: "per agent per day"              },
  { value: "68%",     label: "AI-assisted resolutions", sub: "of total query volume"           },
  { value: "< 2 min", label: "Avg first response",      sub: "down from 18 min industry avg"  },
  { value: "100%",    label: "Human oversight",         sub: "on every customer interaction"  },
];

const Stats = () => (
  <section className="bg-white py-28 px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Results</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          What teams achieve<br />with Credly.
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS_DATA.map((s) => (
          <div
            key={s.value}
            className="bg-stone-50 rounded-3xl p-8 border border-stone-100 text-center"
          >
            <p className="text-4xl lg:text-5xl font-black text-indigo-600 leading-none mb-3 tabular-nums">{s.value}</p>
            <p className="text-sm font-bold text-gray-900 mb-1">{s.label}</p>
            <p className="text-xs text-stone-400 leading-relaxed">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Starter",
    credits: "500 credits",
    price: "$49",
    unit: "one-time",
    desc: "For small support teams starting to bring AI into their workflow.",
    features: [
      "500 AI-assisted conversations",
      "Email channel support",
      "Usage analytics",
      "7-day credit rollover",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    credits: "2,000 credits",
    price: "$149",
    unit: "one-time",
    desc: "For growing teams that need reliable, scalable AI support infrastructure.",
    features: [
      "2,000 AI-assisted conversations",
      "Email + live chat channels",
      "Full analytics dashboard",
      "30-day credit rollover",
      "Human takeover controls",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    credits: "10,000 credits",
    price: "$499",
    unit: "one-time",
    desc: "For high-volume teams that need enterprise-grade support operations.",
    features: [
      "10,000 AI-assisted conversations",
      "All channels",
      "Priority routing",
      "90-day credit rollover",
      "Advanced human takeover controls",
      "Dedicated success manager",
    ],
    highlight: false,
  },
];

const Check = ({ light }: { light: boolean }) => (
  <svg className={`w-4 h-4 flex-shrink-0 ${light ? "text-white/60" : "text-indigo-500"}`} fill="none" viewBox="0 0 16 16">
    <path d="M13 4L6.5 11 3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Pricing = ({ onAuth }: { onAuth: () => void }) => (
  <section id="pricing" className="bg-stone-50 py-28 px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          Scale your team, not your costs.
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          Top up when you need more capacity. No subscriptions. No wasted spend.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl p-8 border transition-all hover:shadow-xl ${
              p.highlight
                ? "bg-gradient-to-b from-indigo-600 to-violet-700 border-transparent shadow-xl shadow-indigo-300/25"
                : "bg-white border-stone-100 shadow-sm"
            }`}
          >
            {p.highlight && (
              <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-white/20">
                Most popular
              </span>
            )}

            <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${p.highlight ? "text-indigo-200" : "text-indigo-600"}`}>
              {p.credits}
            </p>
            <h3 className={`text-2xl font-bold mb-2 ${p.highlight ? "text-white" : "text-gray-900"}`}>
              {p.name}
            </h3>

            <div className="flex items-end gap-1 mb-3">
              <span className={`text-4xl font-black ${p.highlight ? "text-white" : "text-gray-900"}`}>
                {p.price}
              </span>
              <span className={`text-sm mb-1 ${p.highlight ? "text-indigo-200" : "text-stone-400"}`}>
                {p.unit}
              </span>
            </div>

            <p className={`text-sm leading-relaxed mb-6 ${p.highlight ? "text-indigo-100" : "text-stone-500"}`}>
              {p.desc}
            </p>

            <ul className="flex flex-col gap-2.5 mb-8">
              {p.features.map((feat) => (
                <li key={feat} className={`flex items-center gap-2.5 text-sm ${p.highlight ? "text-indigo-100" : "text-stone-600"}`}>
                  <Check light={p.highlight} />
                  {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={onAuth}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                p.highlight
                  ? "bg-white text-indigo-600 hover:bg-stone-50"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
              }`}
            >
              Get started
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "How does AI assist my support team?",
    a: "AI agents work alongside your team in real time — drafting responses, surfacing relevant order and customer context, and flagging conversations that need human attention. Your agents review every suggestion before it reaches the customer.",
  },
  {
    q: "Do my agents stay in control of responses?",
    a: "Always. Every AI-generated draft is a suggestion, not an automated send. Your team reviews, edits, approves, or takes over at any point. Nothing goes to a customer without a human in the loop.",
  },
  {
    q: "What is a credit?",
    a: "One credit equals one AI-assisted customer conversation. When your team resolves an inquiry using Credly's AI tools, it uses one credit from your balance.",
  },
  {
    q: "Do credits expire?",
    a: "Credits roll over depending on your plan — 7, 30, or 90 days. Unused credits carry forward within that window.",
  },
  {
    q: "What channels does Credly support?",
    a: "Currently email and live chat. Integrations with Shopify, Zendesk, and Gorgias are in development and coming soon.",
  },
  {
    q: "When does AI hand off to my team?",
    a: "AI automatically flags conversations that are complex, emotionally sensitive, or outside its confidence threshold — routing them to your team with full context already attached. Nothing falls through the cracks.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-stone-50 py-28 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
            Questions answered
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-stone-200/70">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors pr-6 text-[15px]">
                  {faq.q}
                </span>
                <span className={`text-stone-400 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              <div className={`overflow-hidden transition-all duration-200 ${open === i ? "max-h-48 pb-5" : "max-h-0"}`}>
                <p className="text-stone-500 leading-relaxed text-[15px]">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Final CTA ────────────────────────────────────────────────────────────────

const FinalCTA = ({ onAuth }: { onAuth: () => void }) => (
  <section className="bg-white py-28 px-8">
    <div className="max-w-3xl mx-auto text-center">
      <SectionLabel>Get started</SectionLabel>
      <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-5">
        Ready to build a faster<br />support operation?
      </h2>
      <p className="text-stone-500 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
        Join teams scaling their support without scaling their headcount. Set up in minutes, no developer required.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onAuth}
          className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-base font-semibold px-8 py-3.5 rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-300/30"
        >
          Start free — no credit card required
        </button>
        <button
          onClick={onAuth}
          className="inline-flex items-center justify-center text-stone-600 text-base font-medium px-8 py-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all"
        >
          Talk to our team
        </button>
      </div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="bg-zinc-950 text-zinc-400 px-8 py-14">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div>
        <span className="text-white font-bold text-lg">Credly</span>
        <p className="text-sm mt-1.5 max-w-xs leading-relaxed">
          AI-powered support infrastructure for modern teams.
        </p>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
        <a href="#features"     className="hover:text-white transition-colors">Features</a>
        <a href="#pricing"      className="hover:text-white transition-colors">Pricing</a>
        <a href="#faq"          className="hover:text-white transition-colors">FAQ</a>
        <a href="#"             className="hover:text-white transition-colors">Privacy</a>
        <a href="#"             className="hover:text-white transition-colors">Terms</a>
      </div>

      <p className="text-xs text-zinc-700">© 2026 Credly. All rights reserved.</p>
    </div>
  </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const openAuth = () => setAuthOpen(true);

  return (
    <main className="min-h-screen bg-stone-50">
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      <Navbar onAuth={openAuth} />
      <Hero onAuth={openAuth} />
      <TrustBar />
      <ValueProps />
      <HowItWorks />
      <Features />
      <Stats />
      <Pricing onAuth={openAuth} />
      <FAQ />
      <FinalCTA onAuth={openAuth} />
      <Footer />
    </main>
  );
}
