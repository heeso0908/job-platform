import { describe, it, expect } from 'vitest';
import { FIELD_SCHEMAS, getFieldSchema, getPlaceholders, sanitizeFields } from './experienceFields';

describe('getPlaceholders', () => {
  it('gives category-appropriate, non-personal example text for title and organization', () => {
    expect(getPlaceholders('경력')).toEqual({ title: '회사명', organization: '부서명 (선택)' });
    expect(getPlaceholders('자격증')).toEqual({ title: '자격증명', organization: '발급기관' });
  });

  it('falls back to a generic placeholder for a category without a specific one', () => {
    expect(getPlaceholders('없는카테고리')).toEqual({ title: '제목', organization: '기관/장소 (선택)' });
  });

  it('defines a placeholder for every category', () => {
    for (const c of ['학력', '경력', '프로젝트', '자격증', '어학', '수상', '학내외활동', '봉사', '교육', '스킬', '기타']) {
      const p = getPlaceholders(c);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.organization.length).toBeGreaterThan(0);
    }
  });

  it('never mentions a specific real company, school, or certification name', () => {
    const banned = /SK|실트론|SQLD|ADsP|콜마|전남대|엠트론/i;
    for (const c of ['학력', '경력', '프로젝트', '자격증', '어학', '수상', '학내외활동', '봉사', '교육', '스킬', '기타']) {
      const p = getPlaceholders(c);
      expect(p.title).not.toMatch(banned);
      expect(p.organization).not.toMatch(banned);
    }
  });
});

describe('getFieldSchema', () => {
  it('returns the defined fields for a known category', () => {
    expect(getFieldSchema('경력').map((f) => f.key)).toEqual(['employment_type', 'employment_status', 'department', 'position']);
  });

  it('returns skill-specific fields for 스킬', () => {
    expect(getFieldSchema('스킬').map((f) => f.key)).toEqual(['skill_type', 'level', 'years']);
  });

  it('returns an empty array for categories without extra fields (기타)', () => {
    expect(getFieldSchema('기타')).toEqual([]);
  });

  it('returns an empty array for an unknown category', () => {
    expect(getFieldSchema('없는카테고리')).toEqual([]);
  });
});

describe('FIELD_SCHEMAS coverage', () => {
  it('defines fields for every category that needs them', () => {
    for (const c of ['학력', '경력', '프로젝트', '자격증', '어학', '수상', '학내외활동', '봉사', '교육', '스킬']) {
      expect(FIELD_SCHEMAS[c]?.length).toBeGreaterThan(0);
    }
  });
});

describe('sanitizeFields', () => {
  it('keeps only keys defined in the category schema, trimmed', () => {
    expect(sanitizeFields('경력', { employment_type: ' 정규직 ', department: '기획팀', unknown_key: 'x' })).toEqual({
      employment_type: '정규직',
      department: '기획팀',
    });
  });

  it('drops empty or missing values', () => {
    expect(sanitizeFields('경력', { employment_type: '', department: '   ' })).toEqual({});
  });

  it('drops select values that are not one of the allowed options', () => {
    expect(sanitizeFields('경력', { employment_type: '알바' })).toEqual({});
    expect(sanitizeFields('경력', { employment_type: '정규직' })).toEqual({ employment_type: '정규직' });
  });

  it('drops number fields that are not numeric, keeps numeric ones as strings', () => {
    expect(sanitizeFields('프로젝트', { contribution_percent: 'abc' })).toEqual({});
    expect(sanitizeFields('프로젝트', { contribution_percent: '50' })).toEqual({ contribution_percent: '50' });
  });

  it('returns an empty object for a category with no schema', () => {
    expect(sanitizeFields('기타', { anything: 'x' })).toEqual({});
  });

  it('sanitizes 스킬 fields, dropping a level outside the allowed options', () => {
    expect(sanitizeFields('스킬', { skill_type: '언어', level: '중급', years: '1년' })).toEqual({
      skill_type: '언어',
      level: '중급',
      years: '1년',
    });
    expect(sanitizeFields('스킬', { level: '엄청잘함' })).toEqual({});
  });
});
