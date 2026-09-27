import { describe, it, expect } from 'vitest';
import { buildMonthGrid, formatDisplay, formatValue, from12h, parseValue, to12h } from './datetimeInput';

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

describe('12-hour conversion', () => {
  it('converts 24h to period + 12h', () => {
    expect(to12h(0)).toEqual({ period: '오전', hour12: 12 });
    expect(to12h(9)).toEqual({ period: '오전', hour12: 9 });
    expect(to12h(12)).toEqual({ period: '오후', hour12: 12 });
    expect(to12h(23)).toEqual({ period: '오후', hour12: 11 });
  });

  it('converts back to 24h', () => {
    expect(from12h('오전', 12)).toBe(0);
    expect(from12h('오전', 9)).toBe(9);
    expect(from12h('오후', 12)).toBe(12);
    expect(from12h('오후', 11)).toBe(23);
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
  it('shows a readable Korean date and time', () => {
    expect(formatDisplay('2026-09-27T23:59')).toBe('2026년 9월 27일 오후 11:59');
    expect(formatDisplay('2026-09-27T00:05')).toBe('2026년 9월 27일 오전 12:05');
  });

  it('returns an empty string for an empty value', () => {
    expect(formatDisplay('')).toBe('');
  });
});
