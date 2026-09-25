'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['지원예정', '진행중', '최종합격', '불합격'];

export default function ApplicationActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(next: string) {
    setError(null);
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setError('상태 변경에 실패했어요. 다시 시도해주세요.');
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm('이 공고와 전형 일정을 모두 삭제할까요?')) return;
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('삭제에 실패했어요. 다시 시도해주세요.');
      return;
    }
    router.push('/applications');
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              s === status ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <button type="button" onClick={handleDelete} className="text-sm font-semibold text-ink-400 hover:text-red-500">
        공고 삭제
      </button>
    </div>
  );
}
