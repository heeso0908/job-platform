const STYLES: Record<string, string> = {
  지원예정: 'bg-ink-100 text-ink-500',
  진행중: 'bg-brand-100 text-brand-700',
  최종합격: 'bg-brand-500 text-white',
  불합격: 'bg-red-50 text-red-500',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STYLES[status] ?? STYLES['지원예정']}`}>
      {status}
    </span>
  );
}
