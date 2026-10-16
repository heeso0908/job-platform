import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPrompt, listPrompts } from '@/lib/db/prompts';

export async function GET() {
  const supabase = createServerSupabaseClient();
  return NextResponse.json(await listPrompts(supabase));
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }

  const prompt = await createPrompt(supabase, user.id, {
    category: typeof body.category === 'string' && body.category.trim() ? body.category.trim() : '기타',
    title: body.title.trim(),
    content: typeof body.content === 'string' ? body.content : '',
  });
  return NextResponse.json(prompt, { status: 201 });
}
