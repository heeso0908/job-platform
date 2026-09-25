import { describe, it, expect } from 'vitest';
import { isSafePublicUrl, normalizeJobUrl, parseJobMeta, parseRoles, parseDeadline } from './jobUrl';

describe('parseDeadline', () => {
  const page = (company: unknown) =>
    `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: { pageProps: { initialEmploymentCompany: company } },
    })}</script></html>`;

  it('reads the application end time as an ISO string', () => {
    const html = page({ start_time: '2026-09-01T17:00:00.000+09:00', end_time: '2026-09-27T23:59:00.000+09:00' });
    expect(parseDeadline(html)).toBe('2026-09-27T14:59:00.000Z');
  });

  it('returns null when the end time is missing or invalid', () => {
    expect(parseDeadline(page({ end_time: null }))).toBeNull();
    expect(parseDeadline(page({ end_time: 'not a date' }))).toBeNull();
    expect(parseDeadline(page(undefined))).toBeNull();
  });

  it('returns null for pages without __NEXT_DATA__ or with broken json', () => {
    expect(parseDeadline('<html></html>')).toBeNull();
    expect(parseDeadline('<script id="__NEXT_DATA__" type="application/json">{oops</script>')).toBeNull();
  });
});

describe('parseRoles', () => {
  const nextData = (employments: unknown) =>
    `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: { pageProps: { initialEmploymentCompany: { employments } } },
    })}</script>`;
  const description = (roles: string) =>
    `<meta property="og:description" content="확인해보세요! 모집 직무 : ${roles} - 자소설닷컴" />`;

  it('returns the job table texts exactly as written, in order', () => {
    const html = nextData([
      { id: 1, field: '[HD한국조선해양] 구매' },
      { id: 2, field: '소프트웨어 개발 (삼성전자)' },
      { id: 3, field: '  영업관리  ' },
    ]);
    expect(parseRoles(html)).toEqual(['[HD한국조선해양] 구매', '소프트웨어 개발 (삼성전자)', '영업관리']);
  });

  it('keeps every job table entry, including ones with identical text', () => {
    const html = nextData([{ id: 1, field: '설계' }, { id: 2, field: '설계 ' }, { id: 3, field: '설계(전기)' }]);
    expect(parseRoles(html)).toEqual(['설계', '설계', '설계(전기)']);
  });

  it('skips entries without a usable field', () => {
    const html = nextData([{ field: '' }, { field: null }, { id: 5 }, { field: '기획' }]);
    expect(parseRoles(html)).toEqual(['기획']);
  });

  it('falls back to the 모집 직무 description when the page data has no roles', () => {
    expect(parseRoles(description('개발, 기획, 개발'))).toEqual(['개발', '기획', '개발']);
  });

  it('does not split description roles on commas inside parentheses', () => {
    expect(parseRoles(description('설비(전기, 기계), 영업'))).toEqual(['설비(전기, 기계)', '영업']);
  });

  it('decodes html entities in the description fallback', () => {
    expect(parseRoles(description('A&amp;B 개발, 기획'))).toEqual(['A&B 개발', '기획']);
  });

  it('returns an empty list when there are no roles anywhere', () => {
    expect(parseRoles('<html></html>')).toEqual([]);
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
