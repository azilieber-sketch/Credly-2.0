"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar, { NavItem } from "@/app/_components/Sidebar";
import { supabase } from "@/app/_lib/supabase";

const NAV: NavItem[] = [
  {
    href: "/dashboard",
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
    href: "/inbox",
    label: "Inbox",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    href: "/brand-voice",
    label: "Brand Voice",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z" />
      </svg>
    ),
  },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [email,   setEmail]   = useState<string | null>(null);
  const [ready,   setReady]   = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!supabase) { router.replace("/"); return; }

    let settled = false;

    const resolve = (email: string | null | undefined) => {
      if (settled) return;
      settled = true;
      if (!email) { router.replace("/"); return; }
      if (email === "admin@credly.com") { router.replace("/admin"); return; }
      setEmail(email);
      setReady(true);
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => resolve(session?.user.email))
      .catch(() => { if (!settled) { settled = true; router.replace("/"); } });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { router.replace("/"); return; }
      if (!settled && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        resolve(session?.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  const logout = async () => {
    await supabase!.auth.signOut();
    router.push("/");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-stone-200/60 z-30 flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-lg font-bold text-gray-900">Credly</span>
        <button
          onClick={() => setNavOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h12" />
          </svg>
        </button>
      </header>

      <Sidebar
        navItems={NAV}
        email={email}
        onLogout={logout}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
