'use client';

import { useMemo, useState } from 'react';
import { groupRoles } from '@/lib/jobUrl';

export default function RolePicker({
  roles,
  selected,
  onSelect,
}: {
  roles: string[];
  selected: string | null;
  onSelect: (org: string, job: string) => void;
}) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => groupRoles(roles), [roles]);

  const q = query.trim().toLowerCase();
  const visible = groups
    .map((g) => ({
      org: g.org,
      jobs: g.jobs.filter((j) => !q || j.toLowerCase().includes(q) || g.org.toLowerCase().includes(q)),
    }))
    .filter((g) => g.jobs.length > 0);

  return (
    <div className="space-y-3 rounded-2xl bg-brand-50 p-4">
      <div className="space-y-1">
        <p className="text-sm font-bold text-brand-700">모집 직무 {roles.length}개 중에서 골라주세요</p>
        <p className="text-xs text-ink-500">선택하면 회사명과 직무가 자동으로 채워져요.</p>
      </div>
      <input
        className="input"
        placeholder="직무나 계열사로 검색 (예: 데이터, 중공업)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {visible.map((g) => (
          <div key={g.org || '__none'} className="space-y-2">
            {g.org && <p className="text-xs font-bold text-ink-500">{g.org}</p>}
            <div className="flex flex-wrap gap-2">
              {g.jobs.map((job) => {
                const key = `${g.org}|${job}`;
                const active = selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(g.org, job)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      active ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 hover:bg-brand-100'
                    }`}
                  >
                    {job}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-ink-500">검색 결과가 없어요.</p>}
      </div>
    </div>
  );
}
