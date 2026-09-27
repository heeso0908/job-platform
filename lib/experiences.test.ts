import { describe, it, expect } from 'vitest';
import { buildCopyText, CATEGORIES, formatPeriod } from './experiences';

describe('formatPeriod', () => {
  it('formats a start and end date as YYYY.MM.DD ~ YYYY.MM.DD', () => {
    expect(formatPeriod('2023-01-01', '2024-03-14')).toBe('2023.01.01 ~ 2024.03.14');
  });

  it('shows only the start date when there is no end date (ongoing or single-day)', () => {
    expect(formatPeriod('2024-12-09', null)).toBe('2024.12.09');
  });

  it('shows only the end date when there is no start date', () => {
    expect(formatPeriod(null, '2024-12-09')).toBe('2024.12.09');
  });

  it('returns an empty string when neither date is set', () => {
    expect(formatPeriod(null, null)).toBe('');
  });
});

describe('buildCopyText', () => {
  const base = {
    category: '경력',
    title: 'SK실트론',
    organization: 'Cleaning기술2팀',
    period_start: '2023-01-01',
    period_end: '2024-03-14',
    summary: 'Pro',
    detail: 'Spotfire 활용 액다량 불량 모니터링\n300mm E/I 공정 불량률 70% 감소',
  };

  it('composes title, organization, period, summary and detail as separate lines', () => {
    expect(buildCopyText(base)).toBe(
      [
        'SK실트론',
        'Cleaning기술2팀',
        '2023.01.01 ~ 2024.03.14',
        'Pro',
        '',
        'Spotfire 활용 액다량 불량 모니터링',
        '300mm E/I 공정 불량률 70% 감소',
      ].join('\n')
    );
  });

  it('omits blank optional fields instead of leaving empty lines', () => {
    expect(buildCopyText({ ...base, organization: '', period_start: null, period_end: null, summary: '' })).toBe(
      ['SK실트론', '', 'Spotfire 활용 액다량 불량 모니터링', '300mm E/I 공정 불량률 70% 감소'].join('\n')
    );
  });

  it('drops the blank separator entirely when there is no detail', () => {
    expect(buildCopyText({ ...base, organization: '', period_start: null, period_end: null, summary: '', detail: '' })).toBe(
      'SK실트론'
    );
  });

  it('includes category fields as "label: value" lines, in schema order, before the detail block', () => {
    expect(
      buildCopyText({
        ...base,
        fields: { position: 'Pro', department: 'Cleaning기술2팀', employment_type: '정규직' },
      })
    ).toBe(
      [
        'SK실트론',
        'Cleaning기술2팀',
        '2023.01.01 ~ 2024.03.14',
        'Pro',
        '고용형태: 정규직',
        '부서: Cleaning기술2팀',
        '직급: Pro',
        '',
        'Spotfire 활용 액다량 불량 모니터링',
        '300mm E/I 공정 불량률 70% 감소',
      ].join('\n')
    );
  });

  it('omits category fields that are empty or undefined', () => {
    expect(buildCopyText({ ...base, fields: { position: 'Pro' } })).toBe(
      [
        'SK실트론',
        'Cleaning기술2팀',
        '2023.01.01 ~ 2024.03.14',
        'Pro',
        '직급: Pro',
        '',
        'Spotfire 활용 액다량 불량 모니터링',
        '300mm E/I 공정 불량률 70% 감소',
      ].join('\n')
    );
  });

  it('works with no fields object at all (backward compatible)', () => {
    expect(buildCopyText(base)).toBe(
      [
        'SK실트론',
        'Cleaning기술2팀',
        '2023.01.01 ~ 2024.03.14',
        'Pro',
        '',
        'Spotfire 활용 액다량 불량 모니터링',
        '300mm E/I 공정 불량률 70% 감소',
      ].join('\n')
    );
  });
});

describe('CATEGORIES', () => {
  it('includes the categories seen in a typical 지원서 양식', () => {
    for (const c of ['학력', '경력', '프로젝트', '자격증', '어학', '수상', '학내외활동', '봉사', '교육', '스킬']) {
      expect(CATEGORIES).toContain(c);
    }
  });
});
