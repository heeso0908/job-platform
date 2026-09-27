import { describe, it, expect } from 'vitest';
import { countChars, makeSnippet, normalizeTags, splitHighlight } from './text';

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
