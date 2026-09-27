import { describe, it, expect } from 'vitest';
import { parseQuestionLines } from './essays';

describe('parseQuestionLines', () => {
  it('strips numbering and pulls the character limit out of parentheses', () => {
    expect(parseQuestionLines('1. 지원동기 (500자 이내)')).toEqual([{ question: '지원동기', charLimit: 500 }]);
  });

  it('handles thousands separators and different numbering styles', () => {
    expect(parseQuestionLines('2) 본인의 강점을 서술하시오. (1,000자)')).toEqual([
      { question: '본인의 강점을 서술하시오.', charLimit: 1000 },
    ]);
    expect(parseQuestionLines('Q3. 협업 경험 (최대 700자)')).toEqual([{ question: '협업 경험', charLimit: 700 }]);
  });

  it('understands 공백 포함/제외 wording', () => {
    expect(parseQuestionLines('성장과정 (공백 포함 800자 이내)')).toEqual([{ question: '성장과정', charLimit: 800 }]);
  });

  it('leaves the limit null when none is written', () => {
    expect(parseQuestionLines('입사 후 포부')).toEqual([{ question: '입사 후 포부', charLimit: null }]);
  });

  it('parses several lines and skips blanks', () => {
    const input = '1. 지원동기 (500자)\n\n   \n2. 직무 역량 (700자 이내)\r\n3. 자유 기술';
    expect(parseQuestionLines(input)).toEqual([
      { question: '지원동기', charLimit: 500 },
      { question: '직무 역량', charLimit: 700 },
      { question: '자유 기술', charLimit: null },
    ]);
  });

  it('keeps a line whose only content would be the limit as the question text', () => {
    expect(parseQuestionLines('500자')).toEqual([{ question: '500자', charLimit: null }]);
  });
});
