import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listStages, createStage } from '@/lib/db/stages';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const stages = await listStages(supabase, params.id);
  return NextResponse.json(stages);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const stage = await createStage(supabase, params.id, body);
  return NextResponse.json(stage, { status: 201 });
}
