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

export interface ParsedQuestion {
  question: string;
  charLimit: number | null;
}

const NUMBERING = /^\s*(?:Q\s*\d*\s*[.:)]|\d+\s*[.)]|[①-⑩]|[(（]\d+[)）])\s*/i;
const LIMIT = /[(（\[]?\s*(?:공백\s*(?:포함|제외)\s*)?(?:최대\s*)?(\d[\d,]*)\s*자\s*(?:이내|이하|내외)?\s*[)）\]]?/g;

export function parseQuestionLines(input: string): ParsedQuestion[] {
  const result: ParsedQuestion[] = [];
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const withoutNumber = line.replace(NUMBERING, '').trim();
    const matches = Array.from(withoutNumber.matchAll(LIMIT));
    const last = matches[matches.length - 1];

    if (last) {
      const question = (withoutNumber.slice(0, last.index) + withoutNumber.slice((last.index ?? 0) + last[0].length))
        .replace(/\s+/g, ' ')
        .trim();
      if (question) {
        result.push({ question, charLimit: Number(last[1].replace(/,/g, '')) });
        continue;
      }
    }
    result.push({ question: withoutNumber || line, charLimit: null });
  }
  return result;
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
