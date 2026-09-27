'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { EssayWithApplication } from '@/lib/db/essays';
import { makeSnippet, splitHighlight } from '@/lib/text';

interface SearchResponse {
  results: EssayWithApplication[];
  tags: { tag: string; count: number }[];
}

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  return (
    <>
      {splitHighlight(text, keyword).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded bg-brand-200 px-0.5 text-ink-900">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

export default function EssaySearchPage() {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [submittedOnly, setSubmittedOnly] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (tag) params.set('tag', tag);
        if (submittedOnly) params.set('submitted', '1');
        const res = await fetch(`/api/essays/search?${params}`);
        if (!res.ok) throw new Error('search failed');
        const body: SearchResponse = await res.json();
        if (id === requestId.current) setData(body);
      } catch {
        if (id === requestId.current) setError('검색에 실패했어요. 자소서 테이블이 준비됐는지 확인해주세요.');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tag, submittedOnly]);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      setError('복사에 실패했어요.');
    }
  }

  const keyword = query.trim();

  return (
    <main className="space-y-4 pt-4">
      <div className="space-y-1 px-1">
        <h1 className="text-2xl font-extrabold">자소서 검색</h1>
        <p className="text-sm text-ink-500">회사, 직무, 문항, 답변에서 찾아요. 단어 일부만 써도 돼요.</p>
      </div>

      <div className="card space-y-4">
        <input
          className="input"
          placeholder="키워드 검색 (예: 협업, 갈등, 지원동기)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {data && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map(({ tag: t, count }) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(tag === t ? '' : t)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  tag === t ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                }`}
              >
                #{t} {count}
              </button>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm font-semibold text-ink-500">
          <input
            type="checkbox"
            checked={submittedOnly}
            onChange={(e) => setSubmittedOnly(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          제출 완료만 보기
        </label>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {data && !error && (
        <p className="px-1 text-sm text-ink-500">
          {loading ? '검색 중...' : `${data.results.length}개${data.results.length >= 100 ? ' (최대 100개까지 보여줘요)' : ''}`}
        </p>
      )}

      <ul className="space-y-3">
        {data?.results.map((essay) => (
          <li key={essay.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-bold text-brand-700">
                  {essay.applications ? (
                    <Link href={`/applications/${essay.applications.id}`} className="hover:underline">
                      <Highlight text={`${essay.applications.company} · ${essay.applications.position}`} keyword={keyword} />
                    </Link>
                  ) : (
                    '공고 정보 없음'
                  )}
                </p>
                <p className="font-bold">
                  <Highlight text={essay.question} keyword={keyword} />
                </p>
              </div>
              {essay.submitted_at && (
                <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">제출</span>
              )}
            </div>

            {essay.answer ? (
              <p className="whitespace-pre-wrap rounded-2xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-700">
                <Highlight text={keyword ? makeSnippet(essay.answer, keyword, 90) : makeSnippet(essay.answer, '', 120)} keyword={keyword} />
              </p>
            ) : (
              <p className="text-sm text-ink-400">아직 작성한 답변이 없어요.</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {essay.tags.map((t) => (
                <span key={t} className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                  #{t}
                </span>
              ))}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => copy(essay.id, essay.answer)} disabled={!essay.answer} className="btn-ghost">
                  {copiedId === essay.id ? '복사됨' : '답변 복사'}
                </button>
                {essay.applications && (
                  <Link href={`/applications/${essay.applications.id}`} className="btn-ghost">
                    공고 열기
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {data && !loading && data.results.length === 0 && !error && (
        <div className="card text-center text-ink-500">
          {keyword || tag || submittedOnly ? '검색 결과가 없어요.' : '아직 기록한 자소서가 없어요. 공고 상세에서 문항을 추가해보세요.'}
        </div>
      )}
    </main>
  );
}
