import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { deleteEssay, updateEssay, type UpdateEssayInput } from '@/lib/db/essays';
import { normalizeTags } from '@/lib/essays';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
  }

  const patch: UpdateEssayInput = {};
  if (typeof body.question === 'string' && body.question.trim()) patch.question = body.question.trim();
  if (typeof body.answer === 'string') patch.answer = body.answer;
  if (body.char_limit === null || (Number.isInteger(body.char_limit) && body.char_limit > 0)) {
    patch.char_limit = body.char_limit;
  }
  if (Array.isArray(body.tags)) {
    patch.tags = normalizeTags(body.tags.filter((t: unknown): t is string => typeof t === 'string'));
  }
  if (body.submitted === true) patch.submitted_at = new Date().toISOString();
  if (body.submitted === false) patch.submitted_at = null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없어요.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const essay = await updateEssay(supabase, params.id, patch);
  return NextResponse.json(essay);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deleteEssay(supabase, params.id);
  return NextResponse.json({ ok: true });
}
