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
}

export default function Sidebar({
  navItems,
  email,
  onLogout,
  logoHref = "/dashboard",
  adminBadge = false,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-stone-200/60 flex flex-col flex-shrink-0">
      <div className="px-5 h-[60px] flex items-center gap-2.5 border-b border-stone-100">
        <Link
          href={logoHref}
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

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
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

      <div className="px-3 py-4 border-t border-stone-100">
        {email && (
          <p className="text-[11px] text-stone-400 px-3 mb-2 truncate">{email}</p>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-all text-left"
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
  );
}
