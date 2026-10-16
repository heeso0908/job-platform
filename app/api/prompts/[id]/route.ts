import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { deletePrompt, updatePrompt, type UpdatePromptInput } from '@/lib/db/prompts';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
  }

  const patch: UpdatePromptInput = {};
  if (typeof body.category === 'string' && body.category.trim()) patch.category = body.category.trim();
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.content === 'string') patch.content = body.content;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없어요.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  return NextResponse.json(await updatePrompt(supabase, params.id, patch));
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deletePrompt(supabase, params.id);
  return NextResponse.json({ ok: true });
}
