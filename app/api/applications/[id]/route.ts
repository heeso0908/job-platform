import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication, updateApplication, deleteApplication } from '@/lib/db/applications';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(app);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const app = await updateApplication(supabase, params.id, body);
  return NextResponse.json(app);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deleteApplication(supabase, params.id);
  return NextResponse.json({ ok: true });
}
