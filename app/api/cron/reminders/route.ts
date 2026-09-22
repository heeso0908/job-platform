import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { findDueReminders } from '@/lib/reminders';
import { getSlackWebhook } from '@/lib/db/slackWebhook';
import { sendSlackMessage } from '@/lib/slack';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const dueReminders = await findDueReminders(supabase, new Date());

  let sentCount = 0;
  for (const reminder of dueReminders) {
    const webhookUrl = await getSlackWebhook(supabase, reminder.userId);
    if (!webhookUrl) continue;
    const scheduledDate = new Date(reminder.scheduledAt).toLocaleDateString('ko-KR');
    await sendSlackMessage(
      webhookUrl,
      `[${reminder.company}] ${reminder.position} — ${reminder.stageType} 일정이 ${scheduledDate}입니다.`
    );
    sentCount += 1;
  }

  return NextResponse.json({ checked: dueReminders.length, sent: sentCount });
}
