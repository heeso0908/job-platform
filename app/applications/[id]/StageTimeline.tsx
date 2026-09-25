'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStage } from '@/lib/db/stages';
import { formatKstDateTime } from '@/lib/date';

const STAGE_STATUSES = ['예정', '완료', '통과', '탈락'];

const STATUS_STYLE: Record<string, string> = {
  예정: 'bg-brand-50 text-brand-700',
  완료: 'bg-ink-100 text-ink-500',
  통과: 'bg-brand-500 text-white',
  탈락: 'bg-red-50 text-red-500',
};

export default function StageTimeline({ applicationId, stages }: { applicationId: string; stages: ApplicationStage[] }) {
  const [stageType, setStageType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [daysBefore, setDaysBefore] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage_type: stageType,
        scheduled_at: new Date(scheduledAt).toISOString(),
        slack_reminder_days_before: daysBefore,
        notes: notes || null,
      }),
    });
    if (!res.ok) {
      setError('단계 추가에 실패했어요. 다시 시도해주세요.');
      return;
    }
    setStageType('');
    setScheduledAt('');
    setDaysBefore(1);
    setNotes('');
    router.refresh();
  }

  async function handleStatusChange(id: string, status: string) {
    setError(null);
    const res = await fetch(`/api/stages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError('상태 변경에 실패했어요. 다시 시도해주세요.');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/stages/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('삭제에 실패했어요. 다시 시도해주세요.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {stages.length > 0 && (
        <ol className="space-y-3">
          {stages.map((stage) => (
            <li key={stage.id} className="space-y-3 rounded-2xl bg-ink-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{stage.stage_type}</p>
                  <p className="text-sm text-ink-500">
                    {formatKstDateTime(new Date(stage.scheduled_at))}
                    {' · '}
                    {stage.slack_reminder_days_before}일 전 알림
                  </p>
                  {stage.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{stage.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(stage.id)}
                  className="shrink-0 text-sm font-semibold text-ink-400 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {STAGE_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(stage.id, s)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      s === stage.status ? STATUS_STYLE[s] : 'bg-white text-ink-400 hover:bg-ink-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <p className="text-sm font-bold text-ink-700">일정 추가</p>
        <input
          className="input"
          placeholder="단계 (예: 서류, 인적성, 1차 면접)"
          value={stageType}
          onChange={(e) => setStageType(e.target.value)}
          required
        />
        <input className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        <label className="flex items-center gap-3 text-sm text-ink-500">
          <input
            className="input !w-20 text-center"
            type="number"
            min={0}
            max={30}
            value={daysBefore}
            onChange={(e) => setDaysBefore(Number(e.target.value))}
          />
          일 전에 Slack으로 알림 받기
        </label>
        <textarea className="input min-h-20" placeholder="메모 (선택)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit" className="btn w-full">
          일정 추가
        </button>
      </form>
    </div>
  );
}
