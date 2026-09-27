export interface CharCount {
  withSpaces: number;
  withoutSpaces: number;
}

export function countChars(text: string): CharCount {
  const normalized = text.replace(/\r\n/g, '\n');
  return {
    withSpaces: Array.from(normalized).length,
    withoutSpaces: Array.from(normalized.replace(/\s/g, '')).length,
  };
}

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '').trim().slice(0, MAX_TAG_LENGTH);
    if (tag) seen.add(tag);
  }
  return Array.from(seen).slice(0, MAX_TAGS);
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitHighlight(text: string, keyword: string): HighlightPart[] {
  const kw = keyword.trim();
  if (!kw) return [{ text, match: false }];
  const parts: HighlightPart[] = [];
  const re = new RegExp(escapeRegExp(kw), 'gi');
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), match: false });
    parts.push({ text: m[0], match: true });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts.length > 0 ? parts : [{ text, match: false }];
}

export function makeSnippet(text: string, keyword: string, radius = 60): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const kw = keyword.trim().toLowerCase();
  const idx = kw ? flat.toLowerCase().indexOf(kw) : -1;

  if (flat.length <= radius * 2 + kw.length) return flat;

  if (idx < 0) return `${flat.slice(0, radius * 2)}…`;

  const start = Math.max(0, idx - radius);
  const end = Math.min(flat.length, idx + kw.length + radius);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`;
}
