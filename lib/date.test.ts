import { describe, it, expect } from 'vitest';
import { daysUntilKst, formatKstDate, formatKstDateTime, formatKstTime, kstDayNumber } from './date';

describe('kstDayNumber', () => {
  it('rolls over to the next day at 15:00 UTC (midnight KST)', () => {
    const before = kstDayNumber(new Date('2026-09-26T14:59:59Z'));
    const after = kstDayNumber(new Date('2026-09-26T15:00:00Z'));
    expect(after - before).toBe(1);
  });
});

describe('daysUntilKst', () => {
  it('is 1 the day before, even early in the KST morning (still previous UTC day)', () => {
    const scheduled = new Date('2026-09-27T14:59:00Z'); // 9/27 23:59 KST
    const now = new Date('2026-09-25T23:00:00Z'); // 9/26 08:00 KST
    expect(daysUntilKst(scheduled, now)).toBe(1);
  });

  it('is 0 on the same KST day', () => {
    expect(daysUntilKst(new Date('2026-09-27T14:59:00Z'), new Date('2026-09-26T15:30:00Z'))).toBe(0);
  });

  it('is negative for past dates', () => {
    expect(daysUntilKst(new Date('2026-09-25T03:00:00Z'), new Date('2026-09-27T03:00:00Z'))).toBe(-2);
  });
});

describe('KST formatting', () => {
  const d = new Date('2026-09-27T14:59:00Z');

  it('formats date and time in Korea time regardless of server timezone', () => {
    expect(formatKstDate(d)).toBe('9월 27일');
    expect(formatKstTime(d)).toBe('23:59');
    expect(formatKstDateTime(d)).toBe('9월 27일 23:59');
  });

  it('uses a 24-hour clock with zero-padded hours', () => {
    expect(formatKstTime(new Date('2026-09-26T15:05:00Z'))).toBe('00:05'); // 00:05 KST
    expect(formatKstTime(new Date('2026-09-27T00:30:00Z'))).toBe('09:30'); // 09:30 KST
    expect(formatKstTime(new Date('2026-09-27T03:00:00Z'))).toBe('12:00'); // 12:00 KST
  });
});
