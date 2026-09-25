import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications } from '@/lib/db/applications';
import StatusBadge from '../StatusBadge';

export default async function ApplicationsPage() {
  const supabase = createServerSupabaseClient();
  const apps = await listApplications(supabase);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between px-1 pt-4">
        <h1 className="text-2xl font-extrabold">지원 공고</h1>
        <Link href="/applications/new" className="btn !px-4 !py-2 !text-sm">
          + 새 공고
        </Link>
      </div>
      <ul className="space-y-3">
        {apps.map((app) => (
          <li key={app.id}>
            <Link
              href={`/applications/${app.id}`}
              className="card flex items-center justify-between gap-4 transition hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="truncate font-bold">{app.company}</p>
                <p className="truncate text-sm text-ink-500">{app.position}</p>
              </div>
              <StatusBadge status={app.status} />
            </Link>
          </li>
        ))}
      </ul>
      {apps.length === 0 && <div className="card text-center text-ink-500">아직 등록된 공고가 없어요.</div>}
    </main>
  );
}
