import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSlackWebhook, upsertSlackWebhook } from '@/lib/db/slackWebhook';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhookUrl = await getSlackWebhook(supabase, user.id);
  return NextResponse.json({ webhook_url: webhookUrl });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { webhook_url } = await request.json();
  await upsertSlackWebhook(supabase, user.id, webhook_url);
  return NextResponse.json({ ok: true });
}
