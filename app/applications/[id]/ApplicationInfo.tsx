'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Application } from '@/lib/db/applications';

export default function ApplicationInfo({ app }: { app: Application }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState(app.company);
  const [position, setPosition] = useState(app.position);
  const [applyLink, setApplyLink] = useState(app.apply_link ?? '');
  const [memo, setMemo] = useState(app.memo ?? '');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/applications/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company,
        position,
        apply_link: applyLink || null,
        memo: memo || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('저장에 실패했어요. 다시 시도해주세요.');
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setCompany(app.company);
    setPosition(app.position);
    setApplyLink(app.apply_link ?? '');
    setMemo(app.memo ?? '');
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-3">
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <input className="input" placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} required />
        <input className="input" placeholder="직무" value={position} onChange={(e) => setPosition(e.target.value)} required />
        <input className="input" placeholder="공고 링크 (선택)" value={applyLink} onChange={(e) => setApplyLink(e.target.value)} />
        <textarea className="input min-h-28" placeholder="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} />
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn !px-4 !py-2 !text-sm">
            {saving ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={handleCancel} className="btn-ghost">
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold">{app.company}</h1>
          <p className="text-ink-500">{app.position}</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-sm font-semibold text-ink-400 hover:text-ink-700">
          수정
        </button>
      </div>
      {app.apply_link && (
        <a href={app.apply_link} target="_blank" rel="noreferrer" className="btn-ghost">
          공고 링크 열기
        </a>
      )}
      {app.memo && <p className="whitespace-pre-wrap rounded-2xl bg-ink-100 p-4 text-sm text-ink-700">{app.memo}</p>}
    </div>
  );
}
