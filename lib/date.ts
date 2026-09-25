const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toKst(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

export function kstDayNumber(date: Date): number {
  return Math.floor(toKst(date).getTime() / DAY_MS);
}

export function daysUntilKst(target: Date, now: Date = new Date()): number {
  return kstDayNumber(target) - kstDayNumber(now);
}

export function formatKstDate(date: Date): string {
  const k = toKst(date);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일`;
}

export function formatKstTime(date: Date): string {
  const k = toKst(date);
  const hour = k.getUTCHours();
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${String(hour12).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatKstDateTime(date: Date): string {
  return `${formatKstDate(date)} ${formatKstTime(date)}`;
}
