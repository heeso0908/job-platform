'use client';

import { useState } from 'react';

export default function RolePicker({
  roles,
  selectedIndex,
  onSelect,
}: {
  roles: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = roles
    .map((role, index) => ({ role, index }))
    .filter(({ role }) => !q || role.toLowerCase().includes(q));

  return (
    <div className="space-y-3 rounded-2xl bg-brand-50 p-4">
      <div className="space-y-1">
        <p className="text-sm font-bold text-brand-700">모집 직무 {roles.length}개 중에서 골라주세요</p>
        <p className="text-xs text-ink-500">공고에 적힌 그대로 보여드려요. 선택하면 직무 칸에 들어가요.</p>
      </div>
      <input
        className="input"
        placeholder="직무 검색 (예: 데이터, 영업)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
        {visible.map(({ role, index }) => {
          const active = selectedIndex === index;
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 hover:bg-brand-100'
                }`}
              >
                {role}
              </button>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-1 text-sm text-ink-500">검색 결과가 없어요.</li>}
      </ul>
    </div>
  );
}
