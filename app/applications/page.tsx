'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Application } from '@/lib/db/applications';
import StatusBadge from '../StatusBadge';

const STATUSES = ['지원예정', '진행중', '최종합격', '불합격'];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (status) params.set('status', status);

    fetch(`/api/applications?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        const body = await res.json();
        if (id === requestId.current) {
          setApps(body);
          setError(null);
        }
      })
      .catch(() => {
        if (id === requestId.current) {
          setError('불러오지 못했어요. 다시 시도해주세요.');
          setApps([]);
        }
      });
  }, [query, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between px-1 pt-4">
        <h1 className="text-2xl font-extrabold">지원 공고</h1>
        <Link href="/applications/new" className="btn !px-4 !py-2 !text-sm">
          + 새 공고
        </Link>
      </div>

      <div className="card space-y-3">
        <input
          className="input"
          placeholder="회사명이나 직무 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus('')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              status === '' ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            }`}
          >
            전체
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(status === s ? '' : s)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                status === s ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {apps?.map((app) => (
          <li key={app.id}>
            <Link
              href={`/applications/${app.id}`}
              className="card flex items-center justify-between gap-4 transition hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="truncate font-bold">{app.company}</p>
                <p className="truncate text-sm text-ink-500">{app.position}</p>
              </div>
              <StatusBadge status={app.status} />
            </Link>
          </li>
        ))}
      </ul>

      {apps?.length === 0 && !error && (
        <div className="card text-center text-ink-500">
          {query || status ? '검색 결과가 없어요.' : '아직 등록된 공고가 없어요.'}
        </div>
      )}
    </main>
  );
}
