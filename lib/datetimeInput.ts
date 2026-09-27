export interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function parseValue(value: string): DateTimeParts | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), hour: Number(m[4]), minute: Number(m[5]) };
}

export function formatValue(p: DateTimeParts): string {
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function parseDateValue(value: string): DateParts | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function formatDateValue(p: DateParts): string {
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function formatDateDisplay(value: string): string {
  const p = parseDateValue(value);
  return p ? `${p.year}년 ${p.month}월 ${p.day}일` : '';
}

export function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatDisplay(value: string): string {
  const p = parseValue(value);
  if (!p) return '';
  return `${p.year}년 ${p.month}월 ${p.day}일 ${pad(p.hour)}:${pad(p.minute)}`;
}
