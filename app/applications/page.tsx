import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications } from '@/lib/db/applications';

export default async function ApplicationsPage() {
  const supabase = createServerSupabaseClient();
  const apps = await listApplications(supabase);

  return (
    <main>
      <h1>지원 공고</h1>
      <Link href="/applications/new">+ 새 공고</Link>
      <ul>
        {apps.map((app) => (
          <li key={app.id}>
            <Link href={`/applications/${app.id}`}>
              {app.company} — {app.position} ({app.status})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
