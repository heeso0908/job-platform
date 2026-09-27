import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createExperience, listExperiences, searchExperiences } from '@/lib/db/experiences';
import { normalizeTags } from '@/lib/text';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const params = request.nextUrl.searchParams;
  const q = params.get('q') ?? undefined;
  const category = params.get('category') ?? undefined;
  const tag = params.get('tag') ?? undefined;

  const rows = q || category || tag ? await searchExperiences(supabase, { q, category, tag }) : await listExperiences(supabase);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }

  const experience = await createExperience(supabase, user.id, {
    category: typeof body.category === 'string' ? body.category : undefined,
    title: body.title.trim(),
    organization: typeof body.organization === 'string' ? body.organization : null,
    period_start: typeof body.period_start === 'string' ? body.period_start : null,
    period_end: typeof body.period_end === 'string' ? body.period_end : null,
    summary: typeof body.summary === 'string' ? body.summary : null,
    detail: typeof body.detail === 'string' ? body.detail : '',
    tags: Array.isArray(body.tags) ? normalizeTags(body.tags.filter((t: unknown): t is string => typeof t === 'string')) : [],
  });
  return NextResponse.json(experience, { status: 201 });
}
