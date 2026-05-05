"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageCardProps = {
  label: string;
  labelClass: string;
  customer: string;
  ai: string;
  className?: string;
  creditBadge?: boolean;
};

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

const NAV_IDS = ["home", "services", "about", "pricing", "contact", "faq"] as const;

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
      <a
        href="#home"
        className="text-xl font-bold tracking-tight text-gray-900 hover:text-indigo-600 transition-colors"
      >
        Credly
      </a>

      <div className="hidden md:flex items-center gap-8">
        <a href="#home" className={linkClass("home")}>Home</a>
        <a href="#services" className={linkClass("services")}>Services</a>
        <a href="#about" className={linkClass("about")}>About</a>
        <a href="#pricing" className={linkClass("pricing")}>Pricing</a>
        <a href="#contact" className={linkClass("contact")}>Contact</a>
        <a href="#faq" className={linkClass("faq")}>FAQ</a>
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

// ─── Message Card ─────────────────────────────────────────────────────────────

const MessageCard = ({
  label, labelClass, customer, ai, className = "", creditBadge = false,
}: MessageCardProps) => (
  <div className={`bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-100 p-5 w-72 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${labelClass}`}>
        {label}
      </span>
      {creditBadge && (
        <span className="text-[11px] text-stone-400 font-medium tabular-nums">
          Credits used: 12
        </span>
      )}
    </div>

    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center text-[11px] font-semibold text-stone-500">
        C
      </div>
      <div className="bg-stone-100 rounded-2xl rounded-bl-none px-3 py-2 text-sm text-stone-700 leading-snug max-w-[200px]">
        {customer}
      </div>
    </div>

    <div className="flex items-end justify-end gap-2">
      <div className="bg-violet-50 rounded-2xl rounded-br-none px-3 py-2 text-sm text-violet-800 leading-snug max-w-[200px]">
        {ai}
      </div>
      <div className="w-7 h-7 rounded-full bg-violet-100 flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-violet-600">
        AI
      </div>
    </div>
  </div>
);

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero = ({ onAuth }: { onAuth: () => void }) => (
  <section id="home" className="relative bg-stone-50 overflow-hidden min-h-[calc(100vh-73px)] flex items-center px-8 py-20 lg:py-0">
    {/* Indigo glow — top center */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.11),transparent)] pointer-events-none" />
    {/* Amber warmth — bottom right */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_95%,rgba(251,191,36,0.09),transparent)] pointer-events-none" />

    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full w-fit border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            AI-powered customer support
          </div>

          <h1 className="text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-gray-900 leading-[1.04]">
            Your support,<br />
            <span className="text-indigo-600">handled by AI.</span>
          </h1>

          <p className="text-xl font-semibold text-violet-600 tracking-tight">
            Pay only for what you use.
          </p>

          <p className="text-lg text-stone-500 leading-relaxed max-w-lg">
            Credly uses AI agents to handle your customer support — powered by a flexible credit system with no retainers or wasted spend.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAuth}
            className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-base font-semibold px-7 py-3.5 rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-300/30"
          >
            Start free
          </button>
          <button
            onClick={onAuth}
            className="inline-flex items-center justify-center text-stone-600 text-base font-medium px-7 py-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all"
          >
            Already a client? Sign in
          </button>
        </div>
      </div>

      <div className="relative h-[520px] hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-violet-100 opacity-30 blur-3xl" />
        </div>

        <MessageCard
          label="Order Status"
          labelClass="bg-amber-50 text-amber-700 border border-amber-100"
          customer="Where is my order? It's been 3 days."
          ai="Your order is on its way! Expected delivery is tomorrow by 6 PM."
          creditBadge
          className="absolute top-4 left-0 -rotate-2 z-10"
        />
        <MessageCard
          label="Returns"
          labelClass="bg-emerald-50 text-emerald-700 border border-emerald-100"
          customer="Can I return this? I ordered the wrong size."
          ai="Of course! You have 30 days to return. I've started the process for you."
          className="absolute top-40 right-0 rotate-1 z-20"
        />
        <MessageCard
          label="Shipping"
          labelClass="bg-sky-50 text-sky-700 border border-sky-100"
          customer="Do you ship internationally?"
          ai="Yes! We ship to 50+ countries. Standard delivery takes 5–10 business days."
          className="absolute bottom-4 left-10 -rotate-1 z-30"
        />
      </div>
    </div>
  </section>
);

// ─── Services ─────────────────────────────────────────────────────────────────

const services: ServiceItem[] = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "AI Support Agents",
    desc: "AI agents handle customer inquiries across email and chat — 24/7, with no wait times.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Instant Responses",
    desc: "Customers get accurate answers the moment they ask. No queues, no delays.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    title: "Credit Dashboard",
    desc: "Track usage, credits spent, and conversation volume in real time from your dashboard.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Human Escalation",
    desc: "When AI needs help, it hands off to your team with full conversation context attached.",
  },
];

const Services = () => (
  <section id="services" className="bg-stone-50 py-28 px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <SectionLabel>Services</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          Everything you need
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          Built for ecommerce brands that want support that scales without the overhead.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((s) => (
          <div
            key={s.title}
            className="bg-white rounded-3xl p-7 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5">
              {s.icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── About ────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: "01",
    title: "Connect your channels",
    desc: "Plug in email and chat in minutes. No complex setup, no developer required.",
  },
  {
    num: "02",
    title: "AI handles conversations",
    desc: "Your AI agent reads, understands, and replies to customer inquiries instantly — 24/7.",
  },
  {
    num: "03",
    title: "Pay per credit used",
    desc: "Each resolved conversation costs one credit. Buy more when needed. No subscriptions.",
  },
];

const About = () => (
  <section id="about" className="relative bg-white py-28 px-8 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(99,102,241,0.04),transparent)] pointer-events-none" />
    <div className="max-w-7xl mx-auto relative">
      <div className="text-center mb-16">
        <SectionLabel>About</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          How Credly works
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          Three steps from sign-up to fully automated customer support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s) => (
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

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Starter",
    credits: "500 credits",
    price: "$49",
    unit: "one-time",
    desc: "Perfect for small shops just getting started with AI support.",
    features: [
      "500 customer conversations",
      "Email support channel",
      "Basic analytics",
      "7-day credit rollover",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    credits: "2,000 credits",
    price: "$149",
    unit: "one-time",
    desc: "For growing brands that need reliable, scalable support.",
    features: [
      "2,000 customer conversations",
      "Email + live chat channels",
      "Full analytics dashboard",
      "30-day credit rollover",
      "Human escalation",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    credits: "10,000 credits",
    price: "$499",
    unit: "one-time",
    desc: "High-volume support for established ecommerce brands.",
    features: [
      "10,000 customer conversations",
      "All channels",
      "Priority routing",
      "90-day credit rollover",
      "Human escalation",
      "Dedicated support",
    ],
    highlight: false,
  },
];

const Check = ({ light }: { light: boolean }) => (
  <svg
    className={`w-4 h-4 flex-shrink-0 ${light ? "text-white/60" : "text-indigo-500"}`}
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="M13 4L6.5 11 3 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Pricing = ({ onAuth }: { onAuth: () => void }) => (
  <section id="pricing" className="bg-stone-50 py-28 px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          Buy credits, not subscriptions
        </h2>
        <p className="text-stone-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          Top up when you need. No monthly retainers. No wasted spend.
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
                <li
                  key={feat}
                  className={`flex items-center gap-2.5 text-sm ${p.highlight ? "text-indigo-100" : "text-stone-600"}`}
                >
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

// ─── Contact ──────────────────────────────────────────────────────────────────

const Contact = () => (
  <section id="contact" className="bg-white py-28 px-8">
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Contact</SectionLabel>
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
          Get in touch
        </h2>
        <p className="text-stone-500 mt-4 text-lg leading-relaxed">
          Have a question or want to learn more? We&apos;ll get back to you within one business day.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              placeholder="Jane Smith"
              className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              placeholder="jane@yourbrand.com"
              className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
            Message
          </label>
          <textarea
            rows={4}
            placeholder="Tell us about your support setup or ask us anything..."
            className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none bg-stone-50"
          />
        </div>

        <button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl px-4 py-3 text-sm hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all mt-2">
          Send message
        </button>
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "What is a credit?",
    a: "One credit equals one handled customer conversation. When the AI agent resolves an inquiry end-to-end, it uses one credit from your balance.",
  },
  {
    q: "Do credits expire?",
    a: "Credits roll over depending on your plan — 7, 30, or 90 days. Unused credits carry forward within that window.",
  },
  {
    q: "Can I buy more credits at any time?",
    a: "Yes. Top up anytime from your dashboard with no waiting and no approval process.",
  },
  {
    q: "What channels does Credly support?",
    a: "Currently email and live chat. More channels — including Instagram DMs and WhatsApp — are coming soon.",
  },
  {
    q: "What happens when the AI can't answer?",
    a: "The AI escalates to your human team with full conversation context already attached. Nothing falls through the cracks.",
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
                <span
                  className={`text-stone-400 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-45" : ""
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open === i ? "max-h-40 pb-5" : "max-h-0"
                }`}
              >
                <p className="text-stone-500 leading-relaxed text-[15px]">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="bg-zinc-950 text-zinc-400 px-8 py-14">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div>
        <span className="text-white font-bold text-lg">Credly</span>
        <p className="text-sm mt-1.5 max-w-xs leading-relaxed">
          AI-powered customer support for ecommerce brands.
        </p>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <a href="#services" className="hover:text-white transition-colors">Services</a>
        <a href="#about" className="hover:text-white transition-colors">About</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
      </div>

      <p className="text-xs text-zinc-700">© 2025 Credly. All rights reserved.</p>
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
      <Services />
      <About />
      <Pricing onAuth={openAuth} />
      <Contact />
      <FAQ />
      <Footer />
    </main>
  );
}
