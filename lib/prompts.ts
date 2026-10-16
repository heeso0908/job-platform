export const DEFAULT_PROMPT_CATEGORIES = [
  '지원동기',
  '직무역량',
  '성장과정',
  '협업·갈등',
  '입사 후 포부',
  '첨삭·교정',
  '글자수 조정',
  '기타',
] as const;

const VARIABLE = /\{\{\s*([^{}]*?)\s*\}\}/g;

export function extractVariables(content: string): string[] {
  const seen = new Set<string>();
  for (const match of content.matchAll(VARIABLE)) {
    const name = match[1].trim();
    if (name) seen.add(name);
  }
  return Array.from(seen);
}

// 값이 비어 있는 변수는 {{이름}} 그대로 남겨서, 빠뜨린 칸이 눈에 띄게 한다.
// 함수형 replacer를 쓰는 이유: 값에 `$&`, `$1` 같은 문자열이 있어도(예: 연봉 표기) 그대로 들어가야 해서.
export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE, (whole, rawName: string) => {
    const value = values[rawName.trim()];
    return value !== undefined && value.trim() !== '' ? value : whole;
  });
}
