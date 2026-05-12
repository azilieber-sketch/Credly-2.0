"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  email: string | null;
  onLogout: () => void;
  logoHref?: string;
  adminBadge?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  navItems,
  email,
  onLogout,
  logoHref = "/dashboard",
  adminBadge = false,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:inset-auto md:z-auto
          w-72 md:w-56 flex-shrink-0
          bg-white border-r border-stone-200/60 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="px-5 h-[60px] flex items-center justify-between border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Link
              href={logoHref}
              onClick={onClose}
              className="text-lg font-bold tracking-tight text-gray-900 hover:text-indigo-700 transition-colors"
            >
              Credly
            </Link>
            {adminBadge && (
              <span className="text-[9px] font-semibold tracking-widest uppercase bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>
          {onClose && (
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 text-xl leading-none"
              onClick={onClose}
              aria-label="Close navigation"
            >
              ×
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-100/80"
                    : "font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <span className={isActive ? "text-indigo-500" : "text-stone-400"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-stone-100 flex-shrink-0">
          {email && (
            <p className="text-[11px] text-stone-400 px-3 mb-2 truncate">{email}</p>
          )}
          <button
            onClick={() => { onLogout(); onClose?.(); }}
            className="w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-all text-left"
          >
            <span className="text-stone-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
