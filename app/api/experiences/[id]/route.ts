import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { deleteExperience, updateExperience, type UpdateExperienceInput } from '@/lib/db/experiences';
import { normalizeTags } from '@/lib/text';
import { sanitizeFields } from '@/lib/experienceFields';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
  }

  const patch: UpdateExperienceInput = {};
  if (typeof body.category === 'string' && body.category.trim()) patch.category = body.category.trim();
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
  if (body.organization === null || typeof body.organization === 'string') patch.organization = body.organization || null;
  if (body.period_start === null || typeof body.period_start === 'string') patch.period_start = body.period_start || null;
  if (body.period_end === null || typeof body.period_end === 'string') patch.period_end = body.period_end || null;
  if (body.summary === null || typeof body.summary === 'string') patch.summary = body.summary || null;
  if (typeof body.detail === 'string') patch.detail = body.detail;
  if (Array.isArray(body.tags)) {
    patch.tags = normalizeTags(body.tags.filter((t: unknown): t is string => typeof t === 'string'));
  }
  if (body.fields && typeof body.fields === 'object' && typeof body.category === 'string') {
    patch.fields = sanitizeFields(body.category, body.fields);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없어요.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const experience = await updateExperience(supabase, params.id, patch);
  return NextResponse.json(experience);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deleteExperience(supabase, params.id);
  return NextResponse.json({ ok: true });
}
