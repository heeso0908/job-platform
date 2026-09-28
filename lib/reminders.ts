// lib/reminders.ts

export interface DueReminder {
  stageId: string;
  stageType: string;
  scheduledAt: string;
  scheduledEndAt: string | null;
  company: string;
  position: string;
  userId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeReminderAt(scheduledAt: Date, daysBefore: number): Date {
  return new Date(scheduledAt.getTime() - daysBefore * DAY_MS);
}

export interface StageReminderInfo {
  scheduledAt: Date;
  daysBefore: number;
  lastSentAt: Date | null;
}

// 알림은 "마감 N일 전, 같은 시각"이 지난 순간부터 켜지고, 한 번 보내면
// (last_reminder_sent_at 기록) 다시 켜지지 않는다. 일정이 뒤로 미뤄지면
// 새 기준 시각이 마지막 발송 시각보다 나중이 되어 다시 켜질 수 있다.
// 실제 일정 시각이 지나버린 뒤에는 더 이상 보내지 않는다.
export function isReminderDue(info: StageReminderInfo, now: Date): boolean {
  if (now.getTime() > info.scheduledAt.getTime()) return false;

  const reminderAt = computeReminderAt(info.scheduledAt, info.daysBefore);
  if (now.getTime() < reminderAt.getTime()) return false;
  if (info.lastSentAt && info.lastSentAt.getTime() >= reminderAt.getTime()) return false;

  return true;
}

export async function findDueReminders(supabase: any, now: Date): Promise<DueReminder[]> {
  const { data, error } = await supabase
    .from('application_stages')
    .select(
      'id, stage_type, scheduled_at, scheduled_end_at, slack_reminder_days_before, last_reminder_sent_at, applications(id, company, position, user_id)'
    )
    .eq('status', '예정');
  if (error) throw new Error(error.message);

  return (data as any[])
    .filter((row) =>
      isReminderDue(
        {
          scheduledAt: new Date(row.scheduled_at),
          daysBefore: row.slack_reminder_days_before,
          lastSentAt: row.last_reminder_sent_at ? new Date(row.last_reminder_sent_at) : null,
        },
        now
      )
    )
    .map((row) => ({
      stageId: row.id,
      stageType: row.stage_type,
      scheduledAt: row.scheduled_at,
      scheduledEndAt: row.scheduled_end_at ?? null,
      company: row.applications.company,
      position: row.applications.position,
      userId: row.applications.user_id,
    }));
}
