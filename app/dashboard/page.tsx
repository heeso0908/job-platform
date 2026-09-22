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
        {upcoming.map((item, i) => {
          const days = Math.ceil((new Date(item.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <li key={i}>
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
