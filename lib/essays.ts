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
