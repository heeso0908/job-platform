'use client';

import { useState } from 'react';
import { normalizeTags } from '@/lib/essays';

export default function TagInput({
  tags,
  onChange,
  suggestions = [],
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const next = normalizeTags([...tags, ...raw.split(',')]);
    if (next.length !== tags.length) onChange(next);
    setDraft('');
  }

  const remaining = suggestions.filter((s) => !tags.includes(s)).slice(0, 8);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
            #{tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`${tag} 태그 삭제`}
              className="text-brand-700/70 hover:text-brand-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: 협업, 지원동기)' : '태그 추가'}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-ink-400"
        />
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-200"
            >
              +{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
