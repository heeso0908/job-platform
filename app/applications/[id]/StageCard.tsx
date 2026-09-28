'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStage } from '@/lib/db/stages';
import { formatKstRange } from '@/lib/date';
import DateTimePicker from '../../DateTimePicker';

const STAGE_STATUSES = ['예정', '완료', '통과', '탈락'];

const STATUS_STYLE: Record<string, string> = {
  예정: 'bg-brand-50 text-brand-700',
  완료: 'bg-ink-100 text-ink-500',
  통과: 'bg-brand-500 text-white',
  탈락: 'bg-red-50 text-red-500',
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StageCard({ stage }: { stage: ApplicationStage }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stageType, setStageType] = useState(stage.stage_type);
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(stage.scheduled_at));
  const [scheduledEndAt, setScheduledEndAt] = useState(stage.scheduled_end_at ? toLocalInput(stage.scheduled_end_at) : '');
  const [daysBefore, setDaysBefore] = useState(stage.slack_reminder_days_before);
  const [notes, setNotes] = useState(stage.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/stages/${stage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError('저장에 실패했어요. 다시 시도해주세요.');
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleStatusChange(status: string) {
    await patch({ status });
  }

  async function handleDelete() {
    if (!confirm('이 일정을 삭제할까요?')) return;
    setError(null);
    const res = await fetch(`/api/stages/${stage.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('삭제에 실패했어요. 다시 시도해주세요.');
      return;
    }
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await patch({
      stage_type: stageType,
      scheduled_at: new Date(scheduledAt).toISOString(),
      scheduled_end_at: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null,
      slack_reminder_days_before: daysBefore,
      notes: notes || null,
    });
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-2xl bg-ink-100 p-4">
        <form onSubmit={handleSave} className="space-y-3">
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <input
            className="input bg-white"
            placeholder="단계 (예: 서류, 인적성, 1차 면접)"
            value={stageType}
            onChange={(e) => setStageType(e.target.value)}
            required
          />
          <DateTimePicker value={scheduledAt} onChange={setScheduledAt} placeholder="일정 일시를 선택해주세요" required />
          <DateTimePicker
            value={scheduledEndAt}
            onChange={setScheduledEndAt}
            placeholder="종료 일시 (인적성처럼 시간 범위가 있는 경우, 선택)"
          />
          <label className="flex items-center gap-3 text-sm text-ink-500">
            <input
              className="input !w-20 bg-white text-center"
              type="number"
              min={0}
              max={30}
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
            />
            일 전에 Slack으로 알림 받기
          </label>
          <textarea
            className="input min-h-20 bg-white"
            placeholder="메모 (선택)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn !py-2 !text-sm">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost !bg-white">
              취소
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="space-y-3 rounded-2xl bg-ink-100 p-4">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{stage.stage_type}</p>
          <p className="text-sm text-ink-500">
            {formatKstRange(new Date(stage.scheduled_at), stage.scheduled_end_at ? new Date(stage.scheduled_end_at) : null)}
            {' · '}
            {stage.slack_reminder_days_before}일 전 알림
          </p>
          {stage.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{stage.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-ink-400 hover:text-ink-700">
            수정
          </button>
          <button type="button" onClick={handleDelete} className="text-sm font-semibold text-ink-400 hover:text-red-500">
            삭제
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {STAGE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              s === stage.status ? STATUS_STYLE[s] : 'bg-white text-ink-400 hover:bg-ink-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </li>
  );
}
