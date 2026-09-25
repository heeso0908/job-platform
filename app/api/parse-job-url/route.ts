import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSafePublicUrl, normalizeJobUrl, parseJobMeta, parseRoles, parseDeadline } from '@/lib/jobUrl';

const MAX_REDIRECTS = 3;
const MAX_BYTES = 1_000_000;

async function fetchHtml(startUrl: string): Promise<string | null> {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafePublicUrl(url)) return null;
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;
      url = new URL(location, url).toString();
      continue;
    }
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('text/html')) return null;
    const text = await res.text();
    return text.slice(0, MAX_BYTES);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await request.json().catch(() => ({ url: '' }));
  if (typeof url !== 'string' || !isSafePublicUrl(url)) {
    return NextResponse.json({ error: '올바른 공고 주소가 아니에요.' }, { status: 400 });
  }

  const canonicalUrl = normalizeJobUrl(url);
  try {
    const html = await fetchHtml(canonicalUrl);
    if (!html) return NextResponse.json({ error: '페이지를 불러오지 못했어요.' }, { status: 422 });
    return NextResponse.json({ ...parseJobMeta(html), roles: parseRoles(html), deadline: parseDeadline(html), url: canonicalUrl });
  } catch {
    return NextResponse.json({ error: '페이지를 불러오지 못했어요.' }, { status: 422 });
  }
}
