import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateStage, deleteStage } from '@/lib/db/stages';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const stage = await updateStage(supabase, params.id, body);
  return NextResponse.json(stage);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deleteStage(supabase, params.id);
  return NextResponse.json({ ok: true });
}
