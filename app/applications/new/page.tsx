'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RolePicker from './RolePicker';

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewApplicationPage() {
  const [deadline, setDeadline] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [importState, setImportState] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle');
  const router = useRouter();

  async function importFromUrl(url: string) {
    if (!/^https?:\/\//i.test(url.trim())) return;
    setImportState('loading');
    try {
      const res = await fetch('/api/parse-job-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) throw new Error('parse failed');
      const meta: { company: string; position: string; roles?: string[]; deadline?: string | null; url?: string } = await res.json();
      if (!meta.company && !meta.position) throw new Error('nothing found');
      setDeadline(meta.deadline ? toLocalInput(meta.deadline) : '');
      setRoles(meta.roles ?? []);
      setSelectedRole(null);
      if (meta.url) setApplyLink(meta.url);
      if (meta.company) setCompany(meta.company);
      if (meta.position) setPosition(meta.position);
      setImportState('done');
    } catch {
      setImportState('failed');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, position, apply_link: applyLink || null, memo: memo || null }),
    });
    if (!res.ok) {
      setError('등록에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    const app = await res.json();

    if (deadline) {
      const scheduledAt = new Date(deadline);
      await fetch(`/api/applications/${app.id}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_type: '서류 마감',
          scheduled_at: scheduledAt.toISOString(),
          status: scheduledAt.getTime() < Date.now() ? '완료' : '예정',
        }),
      }).catch(() => {});
    }
    router.push(`/applications/${app.id}`);
  }

  return (
    <main className="pt-4">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h1 className="pb-2 text-2xl font-extrabold">새 공고 등록</h1>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <input
            className="input"
            placeholder="공고 링크를 붙여넣으면 자동으로 채워져요"
            value={applyLink}
            onChange={(e) => {
              setApplyLink(e.target.value);
              setImportState('idle');
              setRoles([]);
              setSelectedRole(null);
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted) void importFromUrl(pasted);
            }}
            onBlur={() => {
              if (importState === 'idle') void importFromUrl(applyLink);
            }}
          />
          {importState === 'loading' && <p className="px-1 text-sm text-ink-500">공고 정보를 불러오는 중이에요...</p>}
          {importState === 'done' && <p className="px-1 text-sm font-semibold text-brand-700">회사와 직무를 불러왔어요. 확인 후 수정할 수 있어요.</p>}
          {importState === 'failed' && <p className="px-1 text-sm text-ink-500">자동으로 읽지 못했어요. 직접 입력해주세요.</p>}
        </div>

        {roles.length > 1 && (
          <RolePicker
            roles={roles}
            selected={selectedRole}
            onSelect={(role) => {
              setSelectedRole(role);
              setPosition(role);
            }}
          />
        )}

        <input className="input" placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} required />
        <input className="input" placeholder="직무" value={position} onChange={(e) => setPosition(e.target.value)} required />
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">
            서류 마감 {importState === 'done' && deadline ? '(공고에서 가져왔어요)' : '(선택)'}
          </span>
          <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <span className="block px-1 text-xs text-ink-400">
            인적성·면접 같은 이후 전형은 등록 후 공고 상세에서 직접 추가해요.
          </span>
        </label>
        <textarea className="input min-h-28" placeholder="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} />
        <button type="submit" className="btn w-full">
          등록하기
        </button>
      </form>
    </main>
  );
}
