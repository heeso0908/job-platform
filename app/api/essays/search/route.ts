import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listTags, searchEssays } from '@/lib/db/essays';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get('q') ?? '').slice(0, 100);
  const tag = (params.get('tag') ?? '').slice(0, 20);
  const submittedOnly = params.get('submitted') === '1';

  const supabase = createServerSupabaseClient();
  const [results, tags] = await Promise.all([
    searchEssays(supabase, { q, tag: tag || undefined, submittedOnly }),
    listTags(supabase),
  ]);
  return NextResponse.json({ results, tags });
}
