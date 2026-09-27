import { describe, it, expect } from 'vitest';
import { buildMonthGrid, formatDisplay, formatValue, parseValue } from './datetimeInput';

describe('parseValue / formatValue', () => {
  it('round-trips a datetime-local string', () => {
    const parts = parseValue('2026-09-27T23:59');
    expect(parts).toEqual({ year: 2026, month: 9, day: 27, hour: 23, minute: 59 });
    expect(formatValue(parts!)).toBe('2026-09-27T23:59');
  });

  it('zero-pads when formatting', () => {
    expect(formatValue({ year: 2026, month: 1, day: 5, hour: 7, minute: 3 })).toBe('2026-01-05T07:03');
  });

  it('returns null for empty or malformed values', () => {
    expect(parseValue('')).toBeNull();
    expect(parseValue('2026-09-27')).toBeNull();
    expect(parseValue('nope')).toBeNull();
  });
});

describe('buildMonthGrid', () => {
  it('lays out September 2026 (starts on Tuesday) with Sunday-first weeks', () => {
    const grid = buildMonthGrid(2026, 9);
    expect(grid[0]).toEqual([null, null, 1, 2, 3, 4, 5]);
    expect(grid[grid.length - 1]).toEqual([27, 28, 29, 30, null, null, null]);
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it('handles leap-year February', () => {
    const days = buildMonthGrid(2028, 2).flat().filter((d): d is number => d !== null);
    expect(days.length).toBe(29);
  });
});

describe('formatDisplay', () => {
  it('shows a readable Korean date with a 24-hour time', () => {
    expect(formatDisplay('2026-09-27T23:59')).toBe('2026년 9월 27일 23:59');
    expect(formatDisplay('2026-09-27T00:05')).toBe('2026년 9월 27일 00:05');
    expect(formatDisplay('2026-09-27T09:30')).toBe('2026년 9월 27일 09:30');
  });

  it('returns an empty string for an empty value', () => {
    expect(formatDisplay('')).toBe('');
  });
});
