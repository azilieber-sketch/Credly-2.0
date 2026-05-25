"use client";

export const SOURCE_COLORS: Record<string, string> = {
  gmail:     "#EA4335",
  instagram: "#E1306C",
  shopify:   "#5C6AC4",
  slack:     "#4A154B",
  unknown:   "#9ca3af",
};

export const SOURCE_LABELS: Record<string, string> = {
  gmail:     "Gmail",
  instagram: "Instagram",
  shopify:   "Shopify",
  slack:     "Slack",
  unknown:   "Unknown",
};

function GmailSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#FCECEA" stroke="#EA4335" strokeWidth="1.5"/>
      <path d="M2 7.5L12 14L22 7.5" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function InstagramSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#FCE4EC" stroke="#E1306C" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="1.5"/>
      <circle cx="17.5" cy="6.5" r="1.1" fill="#E1306C"/>
    </svg>
  );
}

function ShopifySvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#EEF0FB" stroke="#5C6AC4" strokeWidth="1.5"/>
      <path d="M8 17V9.5L12 7L16 9.5V17" stroke="#5C6AC4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 17v-5h4v5" stroke="#5C6AC4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SlackSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#F0EAF6" stroke="#4A154B" strokeWidth="1.5"/>
      <line x1="8.5"  y1="5.5"  x2="7.5"  y2="18.5" stroke="#4A154B" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16.5" y1="5.5"  x2="15.5" y2="18.5" stroke="#4A154B" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5"    y1="9.5"  x2="19"   y2="9.5"  stroke="#4A154B" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5"    y1="14.5" x2="19"   y2="14.5" stroke="#4A154B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function UnknownSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#F5F5F5" stroke="#9ca3af" strokeWidth="1.5"/>
      <path d="M12 8a2 2 0 0 1 1.95 2.4c-.16.7-.65 1.2-1.2 1.55a.5.5 0 0 0-.25.45V14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.9" fill="#9ca3af"/>
    </svg>
  );
}

export function SourceIconRaw({ source, size = 18 }: { source: string | null; size?: number }) {
  const key = (source ?? "unknown").toLowerCase();
  if (key === "gmail")     return <GmailSvg size={size} />;
  if (key === "instagram") return <InstagramSvg size={size} />;
  if (key === "shopify")   return <ShopifySvg size={size} />;
  if (key === "slack")     return <SlackSvg size={size} />;
  return <UnknownSvg size={size} />;
}

export default function SourceIcon({ source, size = 18 }: { source: string | null; size?: number }) {
  const key   = (source ?? "unknown").toLowerCase();
  const label = SOURCE_LABELS[key] ?? "Unknown";

  return (
    <span className="relative group/src inline-flex items-center flex-shrink-0">
      <SourceIconRaw source={source} size={size} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-zinc-900 text-white rounded whitespace-nowrap opacity-0 group-hover/src:opacity-100 transition-opacity z-20">
        {label}
      </span>
    </span>
  );
}
