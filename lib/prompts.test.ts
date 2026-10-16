import { describe, it, expect } from 'vitest';
import { DEFAULT_PROMPT_CATEGORIES, extractVariables, fillVariables } from './prompts';

describe('extractVariables', () => {
  it('returns variable names in order of first appearance, without duplicates', () => {
    const content = '회사: {{회사명}}\n직무: {{직무}}\n다시 한 번 {{회사명}} 이야기를 해줘. {{문항}}';
    expect(extractVariables(content)).toEqual(['회사명', '직무', '문항']);
  });

  it('trims whitespace inside the braces', () => {
    expect(extractVariables('{{ 직무JD }} 와 {{문항   }}')).toEqual(['직무JD', '문항']);
  });

  it('returns an empty list when there are no variables', () => {
    expect(extractVariables('그냥 평범한 프롬프트입니다.')).toEqual([]);
    expect(extractVariables('')).toEqual([]);
  });

  it('ignores empty or unterminated braces', () => {
    expect(extractVariables('{{}} {{   }} {{열리고 안 닫힘')).toEqual([]);
  });
});

describe('fillVariables', () => {
  it('replaces every occurrence of each variable', () => {
    const content = '{{회사명}}의 {{직무}} 자소서. {{회사명}}에 맞게 써줘.';
    expect(fillVariables(content, { 회사명: '삼성전자', 직무: '데이터 분석' })).toBe(
      '삼성전자의 데이터 분석 자소서. 삼성전자에 맞게 써줘.'
    );
  });

  it('matches variables written with inner spaces', () => {
    expect(fillVariables('JD: {{ 직무JD }}', { 직무JD: '파이썬 우대' })).toBe('JD: 파이썬 우대');
  });

  it('keeps multi-line values intact', () => {
    const jd = '[주요업무]\n- 데이터 분석\n- 대시보드 구축';
    expect(fillVariables('JD:\n{{직무JD}}', { 직무JD: jd })).toBe(`JD:\n${jd}`);
  });

  it('inserts values literally, even if they contain $ replacement patterns', () => {
    expect(fillVariables('연봉: {{조건}}', { 조건: '$& $1 $$ 5,000만원' })).toBe('연봉: $& $1 $$ 5,000만원');
  });

  it('leaves a variable as-is when its value is missing or blank, so it stays visible', () => {
    expect(fillVariables('{{회사명}} / {{직무}} / {{문항}}', { 회사명: '코스맥스', 직무: '   ' })).toBe(
      '코스맥스 / {{직무}} / {{문항}}'
    );
  });

  it('does not re-process text that looks like a variable inside a filled value', () => {
    expect(fillVariables('{{문항}} 그리고 {{회사명}}', { 문항: '{{회사명}}을 설명하시오', 회사명: 'A사' })).toBe(
      '{{회사명}}을 설명하시오 그리고 A사'
    );
  });
});

describe('DEFAULT_PROMPT_CATEGORIES', () => {
  it('covers the common 자소서 question types and editing tasks', () => {
    for (const c of ['지원동기', '직무역량', '성장과정', '협업·갈등', '입사 후 포부', '첨삭·교정', '글자수 조정', '기타']) {
      expect(DEFAULT_PROMPT_CATEGORIES).toContain(c);
    }
  });
});
