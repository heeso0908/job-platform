import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createEssays, listEssays } from '@/lib/db/essays';
import { parseQuestionLines } from '@/lib/essays';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const essays = await listEssays(supabase, params.id);
  return NextResponse.json(essays);
}

// body: { text: string } — 줄마다 문항 1개로 파싱해 한꺼번에 추가한다.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text : '';
  const items = parseQuestionLines(text);
  if (items.length === 0) {
    return NextResponse.json({ error: '추가할 문항을 입력해주세요.' }, { status: 400 });
  }

  const existing = await listEssays(supabase, params.id);
  const created = await createEssays(supabase, params.id, items, existing.length);
  return NextResponse.json(created, { status: 201 });
}
