// lib/reminders.test.ts
import { describe, it, expect, vi } from 'vitest';
import { computeReminderAt, isReminderDue, findDueReminders } from './reminders';

describe('computeReminderAt', () => {
  it('subtracts daysBefore whole days, preserving the time of day', () => {
    const scheduled = new Date('2026-10-10T09:00:00Z');
    expect(computeReminderAt(scheduled, 1)).toEqual(new Date('2026-10-09T09:00:00Z'));
    expect(computeReminderAt(scheduled, 0)).toEqual(new Date('2026-10-10T09:00:00Z'));
    expect(computeReminderAt(scheduled, 3)).toEqual(new Date('2026-10-07T09:00:00Z'));
  });
});

describe('isReminderDue', () => {
  const scheduledAt = new Date('2026-10-10T09:00:00Z'); // reminder-at (1일 전) = 2026-10-09T09:00:00Z

  it('is not due before the reminder instant', () => {
    expect(isReminderDue({ scheduledAt, daysBefore: 1, lastSentAt: null }, new Date('2026-10-09T08:59:59Z'))).toBe(false);
  });

  it('becomes due exactly at the reminder instant and stays due afterwards (until sent)', () => {
    expect(isReminderDue({ scheduledAt, daysBefore: 1, lastSentAt: null }, new Date('2026-10-09T09:00:00Z'))).toBe(true);
    expect(isReminderDue({ scheduledAt, daysBefore: 1, lastSentAt: null }, new Date('2026-10-09T14:30:00Z'))).toBe(true);
  });

  it('is not due again once already sent for this reminder instant', () => {
    expect(
      isReminderDue(
        { scheduledAt, daysBefore: 1, lastSentAt: new Date('2026-10-09T09:05:00Z') },
        new Date('2026-10-09T14:00:00Z')
      )
    ).toBe(false);
  });

  it('fires again if the stage was rescheduled later after a previous send', () => {
    // lastSentAt predates the (new, later) reminder instant, so it's due again.
    expect(
      isReminderDue(
        { scheduledAt: new Date('2026-10-12T09:00:00Z'), daysBefore: 1, lastSentAt: new Date('2026-10-09T09:05:00Z') },
        new Date('2026-10-11T09:00:00Z')
      )
    ).toBe(true);
  });

  it('is not due once the scheduled event itself is in the past', () => {
    expect(
      isReminderDue({ scheduledAt: new Date('2026-10-10T09:00:00Z'), daysBefore: 1, lastSentAt: null }, new Date('2026-10-10T09:00:01Z'))
    ).toBe(false);
  });
});

describe('findDueReminders', () => {
  it('filters stages to only those due now and maps them to DueReminder', async () => {
    const rows = [
      {
        id: 'stage-1',
        stage_type: '서류',
        scheduled_at: '2026-10-10T09:00:00.000Z',
        scheduled_end_at: null,
        slack_reminder_days_before: 1,
        last_reminder_sent_at: null,
        applications: { id: 'app-1', company: 'Acme', position: 'SWE', user_id: 'user-1' },
      },
      {
        id: 'stage-2',
        stage_type: '면접',
        scheduled_at: '2026-11-01T15:00:00.000Z',
        scheduled_end_at: null,
        slack_reminder_days_before: 1,
        last_reminder_sent_at: null,
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
    const now = new Date('2026-10-09T09:30:00.000Z');
    const result = await findDueReminders(supabase as any, now);
    expect(result).toEqual([
      {
        stageId: 'stage-1',
        stageType: '서류',
        scheduledAt: '2026-10-10T09:00:00.000Z',
        scheduledEndAt: null,
        company: 'Acme',
        position: 'SWE',
        userId: 'user-1',
      },
    ]);
  });

  it('excludes a stage whose reminder was already sent', async () => {
    const rows = [
      {
        id: 'stage-1',
        stage_type: '서류',
        scheduled_at: '2026-10-10T09:00:00.000Z',
        scheduled_end_at: null,
        slack_reminder_days_before: 1,
        last_reminder_sent_at: '2026-10-09T09:05:00.000Z',
        applications: { id: 'app-1', company: 'Acme', position: 'SWE', user_id: 'user-1' },
      },
    ];
    const supabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: rows, error: null }),
        }),
      })),
    };
    const result = await findDueReminders(supabase as any, new Date('2026-10-09T12:00:00.000Z'));
    expect(result).toEqual([]);
  });
});
