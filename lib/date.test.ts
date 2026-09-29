import { describe, it, expect } from 'vitest';
import { daysUntilKst, formatKstDate, formatKstDateTime, formatKstRange, formatKstTime, formatKstRangeLines, kstDayNumber } from './date';

describe('formatKstRangeLines', () => {
  it('returns [date, time] when there is no end time', () => {
    expect(formatKstRangeLines(new Date('2026-09-27T14:59:00Z'), null)).toEqual(['9월 27일', '23:59']);
  });

  it('returns [date, time~time] when start and end fall on the same KST day', () => {
    expect(formatKstRangeLines(new Date('2026-09-29T10:00:00Z'), new Date('2026-09-29T12:00:00Z'))).toEqual([
      '9월 29일',
      '19:00 ~ 21:00',
    ]);
  });

  it('returns [start date+time, ~ end date+time] when the range spans different KST days', () => {
    expect(formatKstRangeLines(new Date('2026-09-29T10:00:00Z'), new Date('2026-10-03T09:00:00Z'))).toEqual([
      '9월 29일 19:00',
      '~ 10월 3일 18:00',
    ]);
  });
});

describe('formatKstRange', () => {
  it('shows just the start when there is no end', () => {
    expect(formatKstRange(new Date('2026-09-27T14:59:00Z'), null)).toBe('9월 27일 23:59');
  });

  it('shows a single date with a time range when start and end fall on the same KST day', () => {
    expect(formatKstRange(new Date('2026-09-27T00:00:00Z'), new Date('2026-09-27T02:00:00Z'))).toBe('9월 27일 09:00 ~ 11:00');
  });

  it('shows both full dates when the range spans different KST days', () => {
    expect(formatKstRange(new Date('2026-09-27T14:00:00Z'), new Date('2026-09-27T16:00:00Z'))).toBe(
      '9월 27일 23:00 ~ 9월 28일 01:00'
    );
  });
});

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
