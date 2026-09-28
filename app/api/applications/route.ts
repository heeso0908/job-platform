import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications, createApplication, searchApplications } from '@/lib/db/applications';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const params = request.nextUrl.searchParams;
  const q = params.get('q') ?? undefined;
  const status = params.get('status') ?? undefined;

  const apps = q || status ? await searchApplications(supabase, { q, status }) : await listApplications(supabase);
  return NextResponse.json(apps);
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const app = await createApplication(supabase, user.id, body);
  return NextResponse.json(app, { status: 201 });
}
