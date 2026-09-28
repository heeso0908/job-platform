'use client';

import { useEffect, useRef, useState } from 'react';

export default function Select({
  value,
  onChange,
  options,
  placeholder = '선택 안 함',
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input flex items-center justify-between !py-2 text-left ${value ? 'text-ink-900' : 'text-ink-400'} ${
          open ? '!border-brand-500 !ring-4 !ring-brand-100' : ''
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-30 mt-2 max-h-60 w-full min-w-[8rem] overflow-y-auto rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-ink-200"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ''}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                value === '' ? 'bg-brand-500 text-white' : 'text-ink-400 hover:bg-ink-100'
              }`}
            >
              {placeholder}
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  value === opt ? 'bg-brand-500 text-white' : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
