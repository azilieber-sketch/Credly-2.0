// Shared email-pipeline helpers used by /api/email/inbound (store) and
// /api/tickets/[id]/reply (send). Message-IDs are stored BARE — no angle
// brackets — everywhere, so inbound Message-IDs, In-Reply-To and References
// values all compare equal. Re-add brackets only when building outgoing
// RFC 5322 headers.

// Tolerates the ActivePieces field quirks: empty strings, missing keys, and
// unresolved template literals like "{{trigger.message.inReplyTo}}".
export function normalizeMessageId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s || s.includes("{{")) return null;
  const bare = s.replace(/^<+/, "").replace(/>+$/, "");
  return bare || null;
}

// References arrives as a whitespace-separated string or an array depending
// on the parser; either way, normalize each token and drop the junk.
export function normalizeMessageIdList(value: unknown): string[] {
  const tokens = Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.trim().split(/\s+/)
      : [];
  return tokens
    .map(normalizeMessageId)
    .filter((v): v is string => v !== null);
}

// "abc@mail.gmail.com" → "<abc@mail.gmail.com>" for outgoing headers.
export function toRfcMessageId(bare: string): string {
  return bare.startsWith("<") ? bare : `<${bare}>`;
}
