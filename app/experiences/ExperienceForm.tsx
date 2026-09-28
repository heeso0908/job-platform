'use client';

import { useState } from 'react';
import type { Experience } from '@/lib/db/experiences';
import { CATEGORIES } from '@/lib/experiences';
import { getFieldSchema, getPlaceholders } from '@/lib/experienceFields';
import TagInput from '../TagInput';
import DatePicker from '../DatePicker';
import Select from '../Select';

export default function ExperienceForm({
  initial,
  tagSuggestions,
  onSaved,
  onCancel,
}: {
  initial?: Experience;
  tagSuggestions: string[];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [organization, setOrganization] = useState(initial?.organization ?? '');
  const [periodStart, setPeriodStart] = useState(initial?.period_start ?? '');
  const [periodEnd, setPeriodEnd] = useState(initial?.period_end ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [fields, setFields] = useState<Record<string, string>>(initial?.fields ?? {});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = {
      category,
      title,
      organization: organization || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      summary: summary || null,
      detail,
      tags,
      fields,
    };
    const res = initial
      ? await fetch(`/api/experiences/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/experiences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? '저장에 실패했어요. 다시 시도해주세요.');
      return;
    }
    if (!initial) {
      setTitle('');
      setOrganization('');
      setPeriodStart('');
      setPeriodEnd('');
      setSummary('');
      setDetail('');
      setTags([]);
      setFields({});
    }
    onSaved();
  }

  const placeholders = getPlaceholders(category);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-ink-100 p-4">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              setFields({});
            }}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              category === c ? 'bg-brand-500 text-white' : 'bg-white text-ink-500 hover:bg-ink-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <input
        className="input bg-white"
        placeholder={placeholders.title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="input bg-white"
        placeholder={placeholders.organization}
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DatePicker value={periodStart} onChange={setPeriodStart} placeholder="시작일" />
        <DatePicker value={periodEnd} onChange={setPeriodEnd} placeholder="종료일 (진행 중이면 비워두세요)" />
      </div>
      <p className="px-1 text-xs text-ink-400">진행 중이거나 하루짜리 항목은 하나만 입력해도 돼요.</p>

      <input
        className="input bg-white"
        placeholder="한 줄 요약 (선택)"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      {getFieldSchema(category).length > 0 && (
        <div className="grid grid-cols-1 gap-2 rounded-2xl bg-white p-3 sm:grid-cols-2">
          {getFieldSchema(category).map((def) => (
            <label key={def.key} className="space-y-1 text-xs font-semibold text-ink-500">
              {def.label}
              {def.type === 'select' ? (
                <Select
                  value={fields[def.key] ?? ''}
                  onChange={(v) => setFields((f) => ({ ...f, [def.key]: v }))}
                  options={def.options!}
                />
              ) : (
                <input
                  className="input !py-2"
                  type={def.type === 'number' ? 'number' : 'text'}
                  value={fields[def.key] ?? ''}
                  onChange={(e) => setFields((f) => ({ ...f, [def.key]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
      )}

      <textarea
        className="input min-h-32 bg-white"
        placeholder="상세 내용 (담당업무, 성과, 활동내역 등 - 지원서에 그대로 붙여넣을 문단)"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />

      <div className="rounded-2xl bg-white p-3">
        <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn !py-2 !text-sm">
          {saving ? '저장 중...' : initial ? '수정 완료' : '추가하기'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost !bg-white">
            취소
          </button>
        )}
      </div>
    </form>
  );
}
