'use client';

import { useState } from 'react';
import type { Experience } from '@/lib/db/experiences';
import { buildCopyText, formatPeriod } from '@/lib/experiences';
import { getFieldSchema } from '@/lib/experienceFields';
import ExperienceForm from './ExperienceForm';

export default function ExperienceCard({
  experience,
  tagSuggestions,
  onChanged,
}: {
  experience: Experience;
  tagSuggestions: string[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<'card' | 'detail' | null>(null);

  async function copy(text: string, which: 'card' | 'detail') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500);
    } catch {
      // 클립보드 접근이 막힌 브라우저 - 조용히 무시
    }
  }

  async function handleDelete() {
    if (!confirm('이 경험을 삭제할까요?')) return;
    const res = await fetch(`/api/experiences/${experience.id}`, { method: 'DELETE' });
    if (res.ok) onChanged();
  }

  if (editing) {
    return (
      <ExperienceForm
        initial={experience}
        tagSuggestions={tagSuggestions}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const period = formatPeriod(experience.period_start, experience.period_end);

  return (
    <article className="card space-y-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="min-w-0 space-y-1">
          <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{experience.category}</span>
          <p className="truncate font-bold">{experience.title}</p>
          <p className="truncate text-sm text-ink-500">
            {[experience.organization, period, experience.summary].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="shrink-0 pt-1 text-ink-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-3">
          {getFieldSchema(experience.category).some((def) => experience.fields[def.key]) && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-2xl bg-ink-100 p-4 text-sm">
              {getFieldSchema(experience.category).map((def) =>
                experience.fields[def.key] ? (
                  <div key={def.key} className="contents">
                    <dt className="text-ink-400">{def.label}</dt>
                    <dd className="text-ink-700">{experience.fields[def.key]}</dd>
                  </div>
                ) : null
              )}
            </dl>
          )}
          {experience.detail && (
            <p className="whitespace-pre-wrap rounded-2xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-700">{experience.detail}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {experience.tags.map((t) => (
              <span key={t} className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                #{t}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(buildCopyText(experience), 'card')} className="btn-ghost">
              {copied === 'card' ? '복사됨' : '전체 복사'}
            </button>
            {experience.detail && (
              <button type="button" onClick={() => copy(experience.detail, 'detail')} className="btn-ghost">
                {copied === 'detail' ? '복사됨' : '상세만 복사'}
              </button>
            )}
            <button type="button" onClick={() => setEditing(true)} className="btn-ghost">
              수정
            </button>
            <button type="button" onClick={handleDelete} className="ml-auto text-sm font-semibold text-ink-400 hover:text-red-500">
              삭제
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
