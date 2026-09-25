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

  return (
    <main>
      <h1>대시보드</h1>
      <nav>
        <Link href="/applications">지원 공고</Link> | <Link href="/settings">설정</Link>
      </nav>
      <h2>다가오는 일정</h2>
      <ul>
        {upcoming.map((item) => {
          const days = daysUntil(new Date(item.scheduledAt));
          return (
            <li key={`${item.applicationId}-${item.stageType}-${item.scheduledAt}`}>
              <Link href={`/applications/${item.applicationId}`}>
                D{days >= 0 ? `-${days}` : `+${-days}`} — {item.company} {item.stageType} ({new Date(item.scheduledAt).toLocaleString('ko-KR')})
              </Link>
            </li>
          );
        })}
      </ul>
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
