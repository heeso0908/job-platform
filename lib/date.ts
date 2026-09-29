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
  return `${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatKstDateTime(date: Date): string {
  return `${formatKstDate(date)} ${formatKstTime(date)}`;
}

export function formatKstRange(start: Date, end: Date | null): string {
  if (!end) return formatKstDateTime(start);
  const sameDay = kstDayNumber(start) === kstDayNumber(end);
  return sameDay
    ? `${formatKstDate(start)} ${formatKstTime(start)} ~ ${formatKstTime(end)}`
    : `${formatKstDateTime(start)} ~ ${formatKstDateTime(end)}`;
}

// 대시보드 카드처럼 날짜/시각을 두 줄로 나눠 보여주는 자리를 위한 버전.
// 종료일이 시작일과 다른 날이면 두 줄 모두에 날짜를 포함해서, 종료 "시각"만
// 남고 종료 날짜가 사라지는 일이 없게 한다.
export function formatKstRangeLines(start: Date, end: Date | null): [string, string] {
  if (!end) return [formatKstDate(start), formatKstTime(start)];
  const sameDay = kstDayNumber(start) === kstDayNumber(end);
  return sameDay
    ? [formatKstDate(start), `${formatKstTime(start)} ~ ${formatKstTime(end)}`]
    : [formatKstDateTime(start), `~ ${formatKstDateTime(end)}`];
}
