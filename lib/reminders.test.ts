// lib/reminders.test.ts
import { describe, it, expect, vi } from 'vitest';
import { isReminderDue, findDueReminders } from './reminders';

describe('isReminderDue', () => {
  it('is true when today is exactly daysBefore days before the scheduled date', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-09T02:00:00Z');
    expect(isReminderDue(scheduled, 1, today)).toBe(true);
  });

  it('is false when today is two days before but daysBefore is 1', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-08T02:00:00Z');
    expect(isReminderDue(scheduled, 1, today)).toBe(false);
  });

  it('is true for daysBefore = 0 on the scheduled date itself', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-10T23:00:00Z');
    expect(isReminderDue(scheduled, 0, today)).toBe(true);
  });

  it('is false after the reminder date has passed', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-10T02:00:00Z');
    expect(isReminderDue(scheduled, 1, today)).toBe(false);
  });
});

describe('findDueReminders', () => {
  it('filters stages to only those due today and maps them to DueReminder', async () => {
    const rows = [
      {
        id: 'stage-1',
        stage_type: '서류',
        scheduled_at: '2026-10-10T15:00:00.000Z',
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
        scheduledAt: '2026-10-10T15:00:00.000Z',
        company: 'Acme',
        position: 'SWE',
        userId: 'user-1',
      },
    ]);
  });
});
