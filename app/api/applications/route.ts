import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications, createApplication } from '@/lib/db/applications';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const apps = await listApplications(supabase);
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
