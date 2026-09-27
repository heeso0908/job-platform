'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Essay } from '@/lib/db/essays';
import { countChars } from '@/lib/text';
import { formatKstDate } from '@/lib/date';
import TagInput from '../../TagInput';

export default function EssaySection({
  applicationId,
  essays,
  tagSuggestions,
}: {
  applicationId: string;
  essays: Essay[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(essays.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const res = await fetch(`/api/applications/${applicationId}/essays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: bulkText }),
    });
    setAdding(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? '문항 추가에 실패했어요. 다시 시도해주세요.');
      return;
    }
    setBulkText('');
    setShowBulk(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {essays.map((essay) => (
        <EssayCard key={essay.id} essay={essay} tagSuggestions={tagSuggestions} />
      ))}

      {showBulk ? (
        <form onSubmit={handleBulkAdd} className="space-y-3 rounded-2xl bg-ink-100 p-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink-700">문항 추가</p>
            <p className="text-xs text-ink-500">
              문항을 한 줄에 하나씩 붙여넣으세요. 번호와 &quot;(500자 이내)&quot; 같은 글자수는 자동으로 인식해요.
            </p>
          </div>
          <textarea
            className="input min-h-28"
            placeholder={'1. 지원동기 (500자 이내)\n2. 직무 관련 경험 (1,000자)'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={adding} className="btn !py-2 !text-sm">
              {adding ? '추가 중...' : '문항 추가'}
            </button>
            {essays.length > 0 && (
              <button type="button" onClick={() => setShowBulk(false)} className="btn-ghost">
                취소
              </button>
            )}
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowBulk(true)} className="btn-ghost w-full">
          + 문항 추가
        </button>
      )}
    </div>
  );
}

function EssayCard({ essay, tagSuggestions }: { essay: Essay; tagSuggestions: string[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState(essay.question);
  const [limit, setLimit] = useState(essay.char_limit ? String(essay.char_limit) : '');
  const [answer, setAnswer] = useState(essay.answer);
  const [tags, setTags] = useState(essay.tags);
  const [saved, setSaved] = useState({ question: essay.question, limit: essay.char_limit, answer: essay.answer, tags: essay.tags });
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const limitNumber = limit ? Number(limit) : null;
  const counts = countChars(answer);
  const over = limitNumber !== null && counts.withSpaces > limitNumber;
  const dirty =
    question !== saved.question ||
    limitNumber !== saved.limit ||
    answer !== saved.answer ||
    tags.join('\u0000') !== saved.tags.join('\u0000');

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/essays/${essay.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function handleSave() {
    setState('saving');
    const ok = await patch({ question, char_limit: limitNumber, answer, tags });
    if (!ok) {
      setState('error');
      return;
    }
    setSaved({ question, limit: limitNumber, answer, tags });
    setState('saved');
    router.refresh();
  }

  async function handleSubmittedToggle() {
    const ok = await patch({ submitted: !essay.submitted_at });
    if (ok) router.refresh();
    else setState('error');
  }

  async function handleDelete() {
    if (!confirm('이 문항과 작성한 답변을 삭제할까요?')) return;
    const res = await fetch(`/api/essays/${essay.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else setState('error');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setState('error');
    }
  }

  return (
    <article className="space-y-3 rounded-2xl bg-ink-100 p-4">
      <div className="flex items-start gap-3">
        <textarea
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setState('idle');
          }}
          rows={2}
          aria-label="문항"
          className="min-h-0 flex-1 resize-none rounded-xl bg-transparent px-1 py-1 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        <button type="button" onClick={handleDelete} className="shrink-0 text-sm font-semibold text-ink-400 hover:text-red-500">
          삭제
        </button>
      </div>

      <textarea
        className="input min-h-40 bg-white"
        placeholder="답변을 작성하세요"
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setState('idle');
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className={over ? 'font-bold text-red-500' : 'text-ink-500'}>
          {counts.withSpaces.toLocaleString()}자
          {limitNumber !== null && ` / ${limitNumber.toLocaleString()}자`}
          <span className="ml-2 text-xs text-ink-400">공백 제외 {counts.withoutSpaces.toLocaleString()}자</span>
          {over && ` · ${(counts.withSpaces - limitNumber!).toLocaleString()}자 초과`}
        </p>
        <label className="flex items-center gap-2 text-xs text-ink-500">
          글자수 제한
          <input
            type="number"
            min={1}
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value);
              setState('idle');
            }}
            placeholder="없음"
            className="input !w-24 !px-3 !py-1 text-center !text-sm"
          />
        </label>
      </div>

      <TagInput
        tags={tags}
        onChange={(next) => {
          setTags(next);
          setState('idle');
        }}
        suggestions={tagSuggestions}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleSave} disabled={!dirty || state === 'saving'} className="btn !px-4 !py-2 !text-sm">
          {state === 'saving' ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={handleSubmittedToggle}
          className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
            essay.submitted_at ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'bg-white text-ink-500 hover:bg-ink-200'
          }`}
        >
          {essay.submitted_at ? '제출 완료 ✓' : '제출 완료로 표시'}
        </button>
        <button type="button" onClick={handleCopy} disabled={!answer} className="btn-ghost !bg-white">
          {copied ? '복사됨' : '답변 복사'}
        </button>
        {dirty && state !== 'saving' && <span className="text-xs text-ink-400">저장하지 않은 변경이 있어요</span>}
        {state === 'saved' && !dirty && <span className="text-xs font-semibold text-brand-700">저장됐어요</span>}
        {state === 'error' && <span className="text-xs font-semibold text-red-500">실패했어요. 다시 시도해주세요</span>}
        {essay.submitted_at && (
          <span className="ml-auto text-xs text-ink-400">
            제출일 {formatKstDate(new Date(essay.submitted_at))}
          </span>
        )}
      </div>
    </article>
  );
}
