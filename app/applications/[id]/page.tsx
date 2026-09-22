import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication } from '@/lib/db/applications';
import { listStages } from '@/lib/db/stages';
import { notFound } from 'next/navigation';
import StageTimeline from './StageTimeline';

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) notFound();
  const stages = await listStages(supabase, params.id);

  return (
    <main>
      <h1>{app.company} — {app.position}</h1>
      <p>상태: {app.status}</p>
      {app.apply_link && <p><a href={app.apply_link}>공고 링크</a></p>}
      {app.memo && <p>{app.memo}</p>}
      <section>
        <h2>전형 단계</h2>
        <StageTimeline applicationId={app.id} stages={stages} />
      </section>
    </main>
  );
}
