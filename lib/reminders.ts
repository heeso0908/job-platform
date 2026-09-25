// lib/reminders.ts
export interface DueReminder {
  stageId: string;
  stageType: string;
  scheduledAt: string;
  company: string;
  position: string;
  userId: string;
}

function toMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isReminderDue(scheduledAt: Date, daysBefore: number, today: Date): boolean {
  const scheduledMidnight = toMidnightUTC(scheduledAt);
  const reminderDate = new Date(scheduledMidnight);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - daysBefore);
  const todayMidnight = toMidnightUTC(today);
  return reminderDate.getTime() === todayMidnight.getTime();
}

export async function findDueReminders(supabase: any, today: Date): Promise<DueReminder[]> {
  const { data, error } = await supabase.from('application_stages').select('id, stage_type, scheduled_at, slack_reminder_days_before, applications(id, company, position, user_id)').eq('status', '예정');
  if (error) throw new Error(error.message);

  return (data as any[])
    .filter((row) => isReminderDue(new Date(row.scheduled_at), row.slack_reminder_days_before, today))
    .map((row) => ({
      stageId: row.id,
      stageType: row.stage_type,
      scheduledAt: row.scheduled_at,
      company: row.applications.company,
      position: row.applications.position,
      userId: row.applications.user_id,
    }));
}
