'use client';

import { useState } from 'react';
import type { Prompt } from '@/lib/db/prompts';
import { DEFAULT_PROMPT_CATEGORIES, extractVariables } from '@/lib/prompts';

export default function PromptForm({
  initial,
  extraCategories,
  onSaved,
  onCancel,
}: {
  initial?: Prompt;
  extraCategories: string[];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? DEFAULT_PROMPT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = Array.from(new Set<string>([...DEFAULT_PROMPT_CATEGORIES, ...extraCategories, category]));
  const variables = extractVariables(content);

  function addCustomCategory() {
    const name = customCategory.trim();
    if (!name) return;
    setCategory(name);
    setCustomCategory('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = { category, title, content };
    const res = initial
      ? await fetch(`/api/prompts/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/prompts', {
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
      setContent('');
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-ink-100 p-4">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              category === c ? 'bg-brand-500 text-white' : 'bg-white text-ink-500 hover:bg-ink-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input bg-white !py-2"
          placeholder="새 카테고리 직접 입력"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              addCustomCategory();
            }
          }}
        />
        <button type="button" onClick={addCustomCategory} className="btn-ghost shrink-0 !bg-white">
          추가
        </button>
      </div>

      <input
        className="input bg-white"
        placeholder="프롬프트 이름 (예: 지원동기 초안 작성)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className="input min-h-48 bg-white"
        placeholder={'프롬프트 내용. 복사할 때마다 바꿔 넣을 부분은 {{문항}}, {{직무JD}}, {{회사명}}처럼 적어두세요.'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {variables.length > 0 && (
        <p className="px-1 text-xs text-ink-500">
          복사할 때 채울 변수: {variables.map((v) => `{{${v}}}`).join(', ')}
        </p>
      )}

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
