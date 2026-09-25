import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication } from '@/lib/db/applications';
import { listStages } from '@/lib/db/stages';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StageTimeline from './StageTimeline';
import ApplicationActions from './ApplicationActions';

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) notFound();
  const stages = await listStages(supabase, params.id);

  return (
    <main className="space-y-4 pt-4">
      <Link href="/applications" className="px-1 text-sm font-semibold text-ink-400 hover:text-ink-700">
        ← 지원 공고
      </Link>

      <section className="card space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold">{app.company}</h1>
          <p className="text-ink-500">{app.position}</p>
        </div>
        <ApplicationActions id={app.id} status={app.status} />
        {app.apply_link && (
          <a href={app.apply_link} target="_blank" rel="noreferrer" className="btn-ghost">
            공고 링크 열기
          </a>
        )}
        {app.memo && <p className="whitespace-pre-wrap rounded-2xl bg-ink-100 p-4 text-sm text-ink-700">{app.memo}</p>}
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-extrabold">전형 일정</h2>
        <StageTimeline applicationId={app.id} stages={stages} />
      </section>
    </main>
  );
}
