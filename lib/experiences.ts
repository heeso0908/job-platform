import { getFieldSchema } from './experienceFields';

export const CATEGORIES = [
  '학력',
  '경력',
  '프로젝트',
  '자격증',
  '어학',
  '수상',
  '학내외활동',
  '봉사',
  '교육',
  '스킬',
  '기타',
] as const;

export function formatPeriod(start: string | null, end: string | null): string {
  const fmt = (d: string) => d.replaceAll('-', '.');
  if (start && end) return `${fmt(start)} ~ ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return '';
}

export interface CopyableExperience {
  category: string;
  title: string;
  organization: string | null;
  period_start: string | null;
  period_end: string | null;
  summary: string | null;
  detail: string;
  fields?: Record<string, string>;
}

export function buildCopyText(exp: CopyableExperience): string {
  const lines = [exp.title.trim(), exp.organization?.trim() || '', formatPeriod(exp.period_start, exp.period_end), exp.summary?.trim() || ''].filter(
    Boolean
  );

  const fields = exp.fields ?? {};
  for (const def of getFieldSchema(exp.category)) {
    const value = fields[def.key]?.trim();
    if (value) lines.push(`${def.label}: ${value}`);
  }

  const detail = exp.detail.trim();
  return detail ? [...lines, '', detail].join('\n') : lines.join('\n');
}
