'use client';

import { useEffect, useRef, useState } from 'react';
import { buildMonthGrid, formatDisplay, formatValue, parseValue, type DateTimeParts } from '@/lib/datetimeInput';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function todayParts(): Pick<DateTimeParts, 'year' | 'month' | 'day'> {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = '날짜와 시간을 선택해주세요',
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parseValue(value);
  const today = todayParts();

  const [view, setView] = useState({ year: parsed?.year ?? today.year, month: parsed?.month ?? today.month });

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

  function openPicker() {
    if (parsed) setView({ year: parsed.year, month: parsed.month });
    else setView({ year: today.year, month: today.month });
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  function update(patch: Partial<DateTimeParts>) {
    const base: DateTimeParts = parsed ?? { ...today, hour: 9, minute: 0 };
    onChange(formatValue({ ...base, ...patch }));
  }

  const weeks = buildMonthGrid(view.year, view.month);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`input flex items-center justify-between text-left ${parsed ? 'text-ink-900' : 'text-ink-400'} ${
          open ? '!border-brand-500 !ring-4 !ring-brand-100' : ''
        }`}
      >
        <span>{parsed ? formatDisplay(value) : placeholder}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-400" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0 opacity-0"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="날짜와 시간 선택"
          className="absolute left-0 z-30 mt-2 w-full min-w-[19rem] max-w-sm space-y-4 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-ink-200"
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-extrabold">
              {view.year}년 {view.month}월
            </p>
            <div className="flex gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="이전 달" className="btn-ghost !h-9 !w-9 !p-0">
                ‹
              </button>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="다음 달" className="btn-ghost !h-9 !w-9 !p-0">
                ›
              </button>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-7 pb-1 text-center text-xs font-semibold text-ink-400">
              {WEEKDAYS.map((w, i) => (
                <span key={w} className={i === 0 ? 'text-red-400' : ''}>
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {weeks.flat().map((day, i) => {
                if (day === null) return <span key={i} />;
                const selected = parsed?.year === view.year && parsed?.month === view.month && parsed?.day === day;
                const isToday = today.year === view.year && today.month === view.month && today.day === day;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => update({ year: view.year, month: view.month, day })}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                      selected
                        ? 'bg-brand-500 text-white'
                        : isToday
                          ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                          : i % 7 === 0
                            ? 'text-red-400 hover:bg-ink-100'
                            : 'text-ink-700 hover:bg-ink-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 border-t border-ink-100 pt-4">
            <ScrollColumn label="시">
              {HOURS.map((h) => (
                <Option key={h} active={(parsed?.hour ?? 9) === h} onClick={() => update({ hour: h })}>
                  {String(h).padStart(2, '0')}
                </Option>
              ))}
            </ScrollColumn>
            <ScrollColumn label="분">
              {MINUTES.map((m) => (
                <Option key={m} active={(parsed?.minute ?? 0) === m} onClick={() => update({ minute: m })}>
                  {String(m).padStart(2, '0')}
                </Option>
              ))}
            </ScrollColumn>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="px-2 text-sm font-semibold text-ink-400 hover:text-red-500"
            >
              삭제
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  update(today);
                  setView({ year: today.year, month: today.month });
                }}
                className="btn-ghost"
              >
                오늘
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn !px-5 !py-2 !text-sm">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScrollColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 space-y-1">
      <p className="text-center text-xs font-semibold text-ink-400">{label}</p>
      <div className="max-h-36 space-y-1 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'center' });
  }, [active]);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl py-2 text-sm font-semibold transition ${
        active ? 'bg-brand-500 text-white' : 'text-ink-700 hover:bg-ink-100'
      }`}
    >
      {children}
    </button>
  );
}
