import { describe, it, expect } from 'vitest';
import { countChars, makeSnippet, normalizeTags, parseQuestionLines, splitHighlight } from './essays';

describe('countChars', () => {
  it('counts characters with and without whitespace', () => {
    expect(countChars('안녕 하세요')).toEqual({ withSpaces: 6, withoutSpaces: 5 });
  });

  it('counts a newline as one character and ignores it when excluding whitespace', () => {
    expect(countChars('가\r\n나')).toEqual({ withSpaces: 3, withoutSpaces: 2 });
  });

  it('counts emoji as single characters', () => {
    expect(countChars('👍👍')).toEqual({ withSpaces: 2, withoutSpaces: 2 });
  });

  it('returns zeros for empty text', () => {
    expect(countChars('')).toEqual({ withSpaces: 0, withoutSpaces: 0 });
  });
});

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

describe('normalizeTags', () => {
  it('trims, strips leading #, removes duplicates and empties', () => {
    expect(normalizeTags([' #협업 ', '협업', '', '리더십', '#'])).toEqual(['협업', '리더십']);
  });

  it('limits to 10 tags of at most 20 characters', () => {
    const many = Array.from({ length: 15 }, (_, i) => `태그${i}`);
    expect(normalizeTags(many)).toHaveLength(10);
    expect(normalizeTags(['가'.repeat(30)])[0]).toHaveLength(20);
  });
});

describe('splitHighlight', () => {
  it('splits text around case-insensitive matches', () => {
    expect(splitHighlight('Team 협업 team', 'team')).toEqual([
      { text: 'Team', match: true },
      { text: ' 협업 ', match: false },
      { text: 'team', match: true },
    ]);
  });

  it('returns the whole text unmatched for an empty keyword', () => {
    expect(splitHighlight('협업', '  ')).toEqual([{ text: '협업', match: false }]);
  });

  it('treats regex characters in the keyword literally', () => {
    expect(splitHighlight('a.b a+b', 'a.b')).toEqual([
      { text: 'a.b', match: true },
      { text: ' a+b', match: false },
    ]);
  });
});

describe('makeSnippet', () => {
  it('returns short text unchanged', () => {
    expect(makeSnippet('짧은 글', '짧은', 30)).toBe('짧은 글');
  });

  it('centres a window on the first match with ellipses', () => {
    const text = `${'가'.repeat(100)}협업${'나'.repeat(100)}`;
    const snippet = makeSnippet(text, '협업', 10);
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toContain('협업');
    expect(snippet.length).toBeLessThan(30);
  });

  it('falls back to the start of the text when there is no match', () => {
    const text = '가'.repeat(200);
    const snippet = makeSnippet(text, '없음', 20);
    expect(snippet.startsWith('가')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });
});
