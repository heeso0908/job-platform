'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Prompt } from '@/lib/db/prompts';
import { DEFAULT_PROMPT_CATEGORIES } from '@/lib/prompts';
import PromptCard from './PromptCard';
import PromptForm from './PromptForm';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/prompts')
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        setPrompts(await res.json());
        setError(null);
      })
      .catch(() => {
        setError('불러오지 못했어요. Supabase 마이그레이션(0007_prompts.sql)이 적용됐는지 확인해주세요.');
        setPrompts([]);
      });
  }, []);

  useEffect(load, [load]);

  const presentCategories = useMemo(() => {
    const present = new Set((prompts ?? []).map((p) => p.category));
    const ordered: string[] = DEFAULT_PROMPT_CATEGORIES.filter((c) => present.has(c));
    const custom = Array.from(present).filter((c) => !(DEFAULT_PROMPT_CATEGORIES as readonly string[]).includes(c));
    return [...ordered, ...custom.sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [prompts]);

  const customCategories = presentCategories.filter((c) => !(DEFAULT_PROMPT_CATEGORIES as readonly string[]).includes(c));

  const q = query.trim().toLowerCase();
  const visible = (prompts ?? []).filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
  );

  return (
    <main className="space-y-4 pt-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-extrabold">프롬프트</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="btn !px-4 !py-2 !text-sm">
          {showForm ? '닫기' : '+ 새 프롬프트'}
        </button>
      </div>

      {showForm && (
        <PromptForm
          extraCategories={customCategories}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="card space-y-3">
        <input className="input" placeholder="이름이나 내용으로 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              category === '' ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            }`}
          >
            전체
          </button>
          {presentCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? '' : c)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                category === c ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {visible.map((p) => (
          <PromptCard key={p.id} prompt={p} extraCategories={customCategories} onChanged={load} />
        ))}
      </div>

      {prompts && visible.length === 0 && !error && (
        <div className="card text-center text-ink-500">
          {query || category
            ? '검색 결과가 없어요.'
            : '아직 저장한 프롬프트가 없어요. 자소서를 쓸 때 자주 쓰는 프롬프트를 추가해보세요.'}
        </div>
      )}
    </main>
  );
}
