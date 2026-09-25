import { describe, it, expect } from 'vitest';
import { groupRoles, isSafePublicUrl, normalizeJobUrl, parseJobMeta, parseRoles } from './jobUrl';

describe('parseRoles', () => {
  const page = (roles: string) =>
    `<meta property="og:description" content="확인해보세요! 모집 직무 : ${roles} - 자소설닷컴" />`;

  it('splits the 모집 직무 list and removes duplicates', () => {
    const html = page('[HD한국조선해양] 구매, [HD현대중공업] 설계, [HD한국조선해양] 구매');
    expect(parseRoles(html)).toEqual(['[HD한국조선해양] 구매', '[HD현대중공업] 설계']);
  });

  it('does not split on commas inside parentheses', () => {
    expect(parseRoles(page('[A사] 설비(전기, 기계), [A사] 영업'))).toEqual(['[A사] 설비(전기, 기계)', '[A사] 영업']);
  });

  it('decodes html entities', () => {
    expect(parseRoles(page('[A&amp;B] 개발, [A&amp;B] 기획'))).toEqual(['[A&B] 개발', '[A&B] 기획']);
  });

  it('returns an empty list when there is no role list', () => {
    expect(parseRoles('<html></html>')).toEqual([]);
  });
});

describe('groupRoles', () => {
  it('groups bracketed roles by organisation, keeping first-seen order', () => {
    expect(groupRoles(['[B사] 영업', '[A사] 설계', '[B사] 구매'])).toEqual([
      { org: 'B사', jobs: ['영업', '구매'] },
      { org: 'A사', jobs: ['설계'] },
    ]);
  });

  it('puts roles without a bracket into a group with an empty org', () => {
    expect(groupRoles(['비서직', '[A사] 설계'])).toEqual([
      { org: '', jobs: ['비서직'] },
      { org: 'A사', jobs: ['설계'] },
    ]);
  });
});

describe('normalizeJobUrl', () => {
  it('rewrites jasoseol list-modal urls to the detail page', () => {
    expect(normalizeJobUrl('https://jasoseol.com/recruit?ec=105986')).toBe('https://jasoseol.com/recruit/105986');
    expect(normalizeJobUrl('https://jasoseol.com/recruit?foo=1&ec=105986#x')).toBe('https://jasoseol.com/recruit/105986');
    expect(normalizeJobUrl('https://www.jasoseol.com/recruit?ec=42')).toBe('https://jasoseol.com/recruit/42');
  });

  it('leaves other urls untouched', () => {
    expect(normalizeJobUrl('https://jasoseol.com/recruit/90000')).toBe('https://jasoseol.com/recruit/90000');
    expect(normalizeJobUrl('https://example.com/job?ec=1')).toBe('https://example.com/job?ec=1');
    expect(normalizeJobUrl('https://jasoseol.com/recruit?ec=abc')).toBe('https://jasoseol.com/recruit?ec=abc');
  });
});

describe('isSafePublicUrl', () => {
  it('allows normal https urls', () => {
    expect(isSafePublicUrl('https://jasoseol.com/recruit/90000')).toBe(true);
  });

  it('rejects non-http protocols', () => {
    expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);
    expect(isSafePublicUrl('ftp://example.com')).toBe(false);
  });

  it('rejects localhost and private/link-local addresses', () => {
    expect(isSafePublicUrl('http://localhost:3000')).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1')).toBe(false);
    expect(isSafePublicUrl('http://10.0.0.5')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1')).toBe(false);
    expect(isSafePublicUrl('http://172.16.0.1')).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafePublicUrl('http://[::1]/')).toBe(false);
  });

  it('rejects malformed urls', () => {
    expect(isSafePublicUrl('not a url')).toBe(false);
  });
});

describe('parseJobMeta', () => {
  it('parses a jasoseol recruit page', () => {
    const html = `<html><head>
      <title>포항산업과학연구원(RIST) 채용공고 - 23 하반기 연봉계약직 수시채용 (비서직) | 자소서 문항</title>
      <meta property="og:title" content="포항산업과학연구원(RIST) 채용공고 - 23 하반기 연봉계약직 수시채용 (비서직) | 자소서 문항, 지원자 스펙 분석까지" />
      <meta property="og:description" content="자기소개서 문항. 포항산업과학연구원(RIST) 계약직 채용공고를 확인해보세요! 모집 직무 : 비서직 - 자소설닷컴" />
    </head></html>`;
    expect(parseJobMeta(html)).toEqual({ company: '포항산업과학연구원(RIST)', position: '비서직' });
  });

  it('prefers JSON-LD JobPosting when present', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'JobPosting',
      title: '백엔드 개발자',
      hiringOrganization: { '@type': 'Organization', name: '토스' },
    })}</script>`;
    expect(parseJobMeta(html)).toEqual({ company: '토스', position: '백엔드 개발자' });
  });

  it('finds JobPosting inside a JSON-LD array', () => {
    const html = `<script type="application/ld+json">${JSON.stringify([
      { '@type': 'WebSite' },
      { '@type': 'JobPosting', title: '디자이너', hiringOrganization: { name: '카카오' } },
    ])}</script>`;
    expect(parseJobMeta(html)).toEqual({ company: '카카오', position: '디자이너' });
  });

  it('falls back to a cleaned og:title as position when nothing else matches', () => {
    const html = `<meta property="og:title" content="프론트엔드 개발자 채용 | 어떤사이트" />`;
    expect(parseJobMeta(html)).toEqual({ company: '', position: '프론트엔드 개발자 채용' });
  });

  it('decodes html entities', () => {
    const html = `<meta property="og:title" content="A&amp;B 채용공고 - 신입 | 사이트" />`;
    expect(parseJobMeta(html).company).toBe('A&B');
  });

  it('uses JSON-LD for company but prefers the concise 모집 직무 for position', () => {
    const html = `
      <meta property="og:description" content="확인해보세요! 모집 직무 : 비서직 - 자소설닷컴" />
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'JobPosting',
        title: '[포항산업과학연구원(RIST)] 23 하반기 연봉계약직 수시채용 (비서직)',
        hiringOrganization: { name: '포항산업과학연구원(RIST)' },
      })}</script>`;
    expect(parseJobMeta(html)).toEqual({ company: '포항산업과학연구원(RIST)', position: '비서직' });
  });

  it('uses the posting title when the listing has many roles', () => {
    const roles = Array.from({ length: 12 }, (_, i) => `[HD현대중공업] 직무${i}`).join(', ');
    const html = `
      <meta property="og:title" content="HD현대 채용공고 - 26년 하반기 신입사원 모집 | 자소서 문항" />
      <meta property="og:description" content="확인해보세요! 모집 직무 : ${roles} - 자소설닷컴" />`;
    expect(parseJobMeta(html)).toEqual({ company: 'HD현대', position: '26년 하반기 신입사원 모집' });
  });

  it('ignores generic listing titles', () => {
    const html = `<meta property="og:title" content="채용 공고" />`;
    expect(parseJobMeta(html)).toEqual({ company: '', position: '' });
  });

  it('returns empty strings when nothing is found', () => {
    expect(parseJobMeta('<html></html>')).toEqual({ company: '', position: '' });
  });
});
