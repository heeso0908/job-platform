import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { findDueReminders } from '@/lib/reminders';
import { getSlackWebhook } from '@/lib/db/slackWebhook';
import { markStageReminderSent } from '@/lib/db/stages';
import { sendSlackMessage } from '@/lib/slack';
import { formatKstRange } from '@/lib/date';

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const dueReminders = await findDueReminders(supabase, now);

  let sentCount = 0;
  let failedCount = 0;
  const webhookCache = new Map<string, string | null>();

  for (const reminder of dueReminders) {
    try {
      let webhookUrl = webhookCache.get(reminder.userId);
      if (webhookUrl === undefined) {
        webhookUrl = await getSlackWebhook(supabase, reminder.userId);
        webhookCache.set(reminder.userId, webhookUrl);
      }
      if (!webhookUrl) continue;
      const scheduledDate = formatKstRange(
        new Date(reminder.scheduledAt),
        reminder.scheduledEndAt ? new Date(reminder.scheduledEndAt) : null
      );
      await sendSlackMessage(
        webhookUrl,
        `[${reminder.company}] ${reminder.position} — ${reminder.stageType} 일정이 ${scheduledDate}입니다.`
      );
      await markStageReminderSent(supabase, reminder.stageId, now.toISOString());
      sentCount += 1;
    } catch (err) {
      failedCount += 1;
    }
  }

  return NextResponse.json({ checked: dueReminders.length, sent: sentCount, failed: failedCount });
}
