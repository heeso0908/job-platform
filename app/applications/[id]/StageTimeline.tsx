'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStage } from '@/lib/db/stages';
import DateTimePicker from '../../DateTimePicker';
import StageCard from './StageCard';

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
            <StageCard key={stage.id} stage={stage} />
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
        <DateTimePicker value={scheduledAt} onChange={setScheduledAt} placeholder="일정 일시를 선택해주세요" required />
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
