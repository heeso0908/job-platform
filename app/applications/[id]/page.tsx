import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication } from '@/lib/db/applications';
import { notFound } from 'next/navigation';

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) notFound();

  return (
    <main>
      <h1>{app.company} — {app.position}</h1>
      <p>상태: {app.status}</p>
      {app.apply_link && <p><a href={app.apply_link}>공고 링크</a></p>}
      {app.memo && <p>{app.memo}</p>}
      <section id="stages">
        <h2>전형 단계</h2>
        {/* Stage list/form added in Task 8 */}
      </section>
    </main>
  );
}
