// lib/reminders.test.ts
import { describe, it, expect, vi } from 'vitest';
import { isReminderDue, findDueReminders } from './reminders';

describe('isReminderDue (Korea time day boundaries)', () => {
  const scheduled = new Date('2026-10-10T14:59:00Z'); // 10/10 23:59 KST

  it('is true on the KST day that is daysBefore days before', () => {
    expect(isReminderDue(scheduled, 1, new Date('2026-10-09T00:00:00Z'))).toBe(true); // 10/9 09:00 KST (cron time)
  });

  it('is true even early KST morning, when the UTC date is still the previous day', () => {
    expect(isReminderDue(scheduled, 1, new Date('2026-10-08T15:30:00Z'))).toBe(true); // 10/9 00:30 KST
  });

  it('is false two days before when daysBefore is 1', () => {
    expect(isReminderDue(scheduled, 1, new Date('2026-10-08T03:00:00Z'))).toBe(false); // 10/8 12:00 KST
  });

  it('is true for daysBefore = 0 on the scheduled KST day', () => {
    expect(isReminderDue(scheduled, 0, new Date('2026-10-10T00:00:00Z'))).toBe(true); // 10/10 09:00 KST
  });

  it('is false after the reminder day has passed', () => {
    expect(isReminderDue(scheduled, 1, new Date('2026-10-10T00:00:00Z'))).toBe(false);
  });

  it('uses the KST calendar date of the stage, not the UTC date', () => {
    const justAfterMidnightKst = new Date('2026-10-10T15:30:00Z'); // 10/11 00:30 KST
    expect(isReminderDue(justAfterMidnightKst, 1, new Date('2026-10-10T00:00:00Z'))).toBe(true); // 10/10 09:00 KST
    expect(isReminderDue(justAfterMidnightKst, 1, new Date('2026-10-09T00:00:00Z'))).toBe(false);
  });
});

describe('findDueReminders', () => {
  it('filters stages to only those due today and maps them to DueReminder', async () => {
    const rows = [
      {
        id: 'stage-1',
        stage_type: '서류',
        scheduled_at: '2026-10-10T14:59:00.000Z',
        slack_reminder_days_before: 1,
        applications: { id: 'app-1', company: 'Acme', position: 'SWE', user_id: 'user-1' },
      },
      {
        id: 'stage-2',
        stage_type: '면접',
        scheduled_at: '2026-11-01T15:00:00.000Z',
        slack_reminder_days_before: 1,
        applications: { id: 'app-2', company: 'Globex', position: 'PM', user_id: 'user-1' },
      },
    ];
    const supabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: rows, error: null }),
        }),
      })),
    };
    const today = new Date('2026-10-09T02:00:00Z');
    const result = await findDueReminders(supabase as any, today);
    expect(result).toEqual([
      {
        stageId: 'stage-1',
        stageType: '서류',
        scheduledAt: '2026-10-10T14:59:00.000Z',
        company: 'Acme',
        position: 'SWE',
        userId: 'user-1',
      },
    ]);
  });
});
