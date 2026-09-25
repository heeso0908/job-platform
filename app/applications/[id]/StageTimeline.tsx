'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStage } from '@/lib/db/stages';

export default function StageTimeline({ applicationId, stages }: { applicationId: string; stages: ApplicationStage[] }) {
  const [stageType, setStageType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/applications/${applicationId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_type: stageType, scheduled_at: new Date(scheduledAt).toISOString() }),
    });
    if (!res.ok) {
      alert('단계 추가에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    setStageType('');
    setScheduledAt('');
    router.refresh();
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/stages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert('상태 변경에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/stages/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <ul>
        {stages.map((stage) => (
          <li key={stage.id}>
            {stage.stage_type} — {new Date(stage.scheduled_at).toLocaleString('ko-KR')} —
            <select value={stage.status} onChange={(e) => handleStatusChange(stage.id, e.target.value)}>
              <option value="예정">예정</option>
              <option value="완료">완료</option>
              <option value="통과">통과</option>
              <option value="탈락">탈락</option>
            </select>
            <button type="button" onClick={() => handleDelete(stage.id)}>삭제</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd}>
        <input placeholder="단계 (예: 서류, 1차면접)" value={stageType} onChange={(e) => setStageType(e.target.value)} required />
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        <button type="submit">단계 추가</button>
      </form>
    </div>
  );
}
