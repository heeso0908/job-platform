'use client';

import { useMemo, useState } from 'react';
import type { Prompt } from '@/lib/db/prompts';
import { extractVariables, fillVariables } from '@/lib/prompts';
import PromptForm from './PromptForm';

export default function PromptCard({
  prompt,
  extraCategories,
  onChanged,
}: {
  prompt: Prompt;
  extraCategories: string[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const variables = useMemo(() => extractVariables(prompt.content), [prompt.content]);
  const filled = useMemo(() => fillVariables(prompt.content, values), [prompt.content, values]);
  const missing = variables.filter((v) => !(values[v] ?? '').trim());

  async function handleCopy() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
    }
  }

  async function handleDelete() {
    if (!confirm('이 프롬프트를 삭제할까요?')) return;
    const res = await fetch(`/api/prompts/${prompt.id}`, { method: 'DELETE' });
    if (res.ok) onChanged();
  }

  if (editing) {
    return (
      <PromptForm
        initial={prompt}
        extraCategories={extraCategories}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <article className="card space-y-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="min-w-0 space-y-1">
          <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{prompt.category}</span>
          <p className="truncate font-bold">{prompt.title}</p>
          <p className="truncate text-sm text-ink-500">
            {variables.length > 0 ? `변수 ${variables.length}개: ${variables.join(', ')}` : '변수 없음'}
          </p>
        </div>
        <span className="shrink-0 pt-1 text-ink-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-4">
          {variables.length > 0 && (
            <div className="space-y-3 rounded-2xl bg-ink-100 p-4">
              <p className="text-sm font-bold text-ink-700">복사 전에 빈칸을 채워주세요</p>
              {variables.map((name) => (
                <label key={name} className="block space-y-2 text-xs font-semibold text-ink-500">
                  <span className="block">{name}</span>
                  <textarea
                    className="input min-h-20 bg-white !py-2 text-sm"
                    value={values[name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                    placeholder={`${name} 내용을 붙여넣으세요`}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-400">{variables.length > 0 ? '복사될 내용 미리보기' : '프롬프트 내용'}</p>
            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-ink-100 p-4 font-sans text-sm leading-relaxed text-ink-700">
              {filled || '(내용이 비어 있어요)'}
            </pre>
          </div>

          {missing.length > 0 && (
            <p className="px-1 text-xs text-ink-500">
              아직 비어 있는 변수가 있어요: {missing.map((m) => `{{${m}}}`).join(', ')} — 그대로 복사하면 빈칸으로 남아요.
            </p>
          )}
          {copyError && (
            <p role="alert" className="error">
              복사에 실패했어요. 미리보기 내용을 직접 선택해서 복사해주세요.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleCopy} disabled={!filled} className="btn !px-4 !py-2 !text-sm">
              {copied ? '복사됨' : '복사하기'}
            </button>
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
