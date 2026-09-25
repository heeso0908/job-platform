import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications } from '@/lib/db/applications';
import { listStages } from '@/lib/db/stages';

interface UpcomingItem {
  applicationId: string;
  company: string;
  position: string;
  stageType: string;
  scheduledAt: string;
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const applications = await listApplications(supabase);

  const upcoming: UpcomingItem[] = [];
  for (const app of applications) {
    const stages = await listStages(supabase, app.id);
    for (const stage of stages) {
      if (stage.status === '예정') {
        upcoming.push({
          applicationId: app.id,
          company: app.company,
          position: app.position,
          stageType: stage.stage_type,
          scheduledAt: stage.scheduled_at,
        });
      }
    }
  }
  upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const inProgress = applications.filter((a) => a.status === '진행중').length;

  return (
    <main className="space-y-6">
      <section className="space-y-1 px-1 pt-4">
        <h1 className="text-2xl font-extrabold leading-snug">
          {upcoming.length > 0 ? (
            <>
              다가오는 일정이
              <br />
              {upcoming.length}개 있어요
            </>
          ) : (
            <>
              예정된 일정이
              <br />
              없어요
            </>
          )}
        </h1>
        <p className="text-sm text-ink-500">
          전체 공고 {applications.length}개 · 진행 중 {inProgress}개
        </p>
      </section>

      <section className="space-y-3">
        {upcoming.map((item) => {
          const days = daysUntil(new Date(item.scheduledAt));
          return (
            <Link
              key={`${item.applicationId}-${item.stageType}-${item.scheduledAt}`}
              href={`/applications/${item.applicationId}`}
              className="card flex items-center gap-4 transition hover:shadow-md"
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${
                  days <= 1 ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-700'
                }`}
              >
                {days === 0 ? 'D-DAY' : days > 0 ? `D-${days}` : `D+${-days}`}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {item.company} · {item.stageType}
                </p>
                <p className="truncate text-sm text-ink-500">{item.position}</p>
              </div>
              <p className="shrink-0 text-right text-sm text-ink-400">
                {new Date(item.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                <br />
                {new Date(item.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Link>
          );
        })}
        {upcoming.length === 0 && (
          <div className="card space-y-4 text-center">
            <p className="text-ink-500">공고를 등록하고 전형 일정을 추가해보세요.</p>
            <Link href="/applications/new" className="btn">
              공고 등록하기
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function toMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysUntil(scheduledAt: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((toMidnightUTC(scheduledAt).getTime() - toMidnightUTC(new Date()).getTime()) / msPerDay);
}
