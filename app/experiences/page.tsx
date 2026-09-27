'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Experience } from '@/lib/db/experiences';
import { CATEGORIES } from '@/lib/experiences';
import ExperienceCard from './ExperienceCard';
import ExperienceForm from './ExperienceForm';

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);

    fetch(`/api/experiences?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        const body = await res.json();
        if (id === requestId.current) {
          setExperiences(body);
          setError(null);
        }
      })
      .catch(() => {
        if (id === requestId.current) {
          setError('불러오지 못했어요. Supabase 마이그레이션이 적용됐는지 확인해주세요.');
          setExperiences([]);
        }
      });
  }, [query, category]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const tagSuggestions = Array.from(new Set((experiences ?? []).flatMap((e) => e.tags)));

  return (
    <main className="space-y-4 pt-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-extrabold">경험</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="btn !px-4 !py-2 !text-sm">
          {showForm ? '닫기' : '+ 새 경험'}
        </button>
      </div>

      {showForm && (
        <ExperienceForm
          tagSuggestions={tagSuggestions}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="card space-y-3">
        <input
          className="input"
          placeholder="제목이나 상세 내용 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
          {CATEGORIES.map((c) => (
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
        {experiences?.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} tagSuggestions={tagSuggestions} onChanged={load} />
        ))}
      </div>

      {experiences?.length === 0 && !error && (
        <div className="card text-center text-ink-500">
          {query || category ? '검색 결과가 없어요.' : '아직 등록한 경험이 없어요. 지원서에 자주 쓰는 항목을 추가해보세요.'}
        </div>
      )}
    </main>
  );
}
