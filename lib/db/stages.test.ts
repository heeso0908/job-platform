import { describe, it, expect, vi } from 'vitest';
import { listStages, createStage, updateStage, deleteStage, markStageReminderSent } from './stages';

function makeSupabaseStub(overrides: Record<string, any>) {
  return { from: vi.fn(() => overrides) };
}

describe('stages data layer', () => {
  it('listStages returns rows ordered by scheduled_at', async () => {
    const rows = [{ id: '1' }, { id: '2' }];
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    });
    const result = await listStages(supabase as any, 'app-1');
    expect(result).toEqual(rows);
  });

  it('createStage inserts with defaults', async () => {
    const created = { id: '1', stage_type: '서류', status: '예정' };
    let insertedWith: any = null;
    const supabase = makeSupabaseStub({
      insert: (payload: any) => {
        insertedWith = payload;
        return { select: () => ({ single: () => Promise.resolve({ data: created, error: null }) }) };
      },
    });
    const result = await createStage(supabase as any, 'app-1', {
      stage_type: '서류',
      scheduled_at: '2026-10-01T00:00:00.000Z',
    });
    expect(result).toEqual(created);
    expect(insertedWith).toEqual({
      application_id: 'app-1',
      stage_type: '서류',
      scheduled_at: '2026-10-01T00:00:00.000Z',
      scheduled_end_at: null,
      status: '예정',
      notes: null,
      slack_reminder_days_before: 1,
    });
  });

  it('createStage accepts an optional end time for ranged stages like 인적성', async () => {
    const created = { id: '2', stage_type: '인적성' };
    let insertedWith: any = null;
    const supabase = makeSupabaseStub({
      insert: (payload: any) => {
        insertedWith = payload;
        return { select: () => ({ single: () => Promise.resolve({ data: created, error: null }) }) };
      },
    });
    await createStage(supabase as any, 'app-1', {
      stage_type: '인적성',
      scheduled_at: '2026-10-01T00:00:00.000Z',
      scheduled_end_at: '2026-10-01T02:00:00.000Z',
    });
    expect(insertedWith).toMatchObject({ scheduled_end_at: '2026-10-01T02:00:00.000Z' });
  });

  it('updateStage updates by id', async () => {
    const updated = { id: '1', status: '완료' };
    const supabase = makeSupabaseStub({
      update: () => ({
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: updated, error: null }) }) }),
      }),
    });
    const result = await updateStage(supabase as any, '1', { status: '완료' });
    expect(result).toEqual(updated);
  });

  it('deleteStage deletes by id', async () => {
    const supabase = makeSupabaseStub({ delete: () => ({ eq: () => Promise.resolve({ error: null }) }) });
    await expect(deleteStage(supabase as any, '1')).resolves.toBeUndefined();
  });

  it('markStageReminderSent sets last_reminder_sent_at by id', async () => {
    let updatedWith: any = null;
    const supabase = makeSupabaseStub({
      update: (payload: any) => {
        updatedWith = payload;
        return { eq: () => Promise.resolve({ error: null }) };
      },
    });
    await expect(markStageReminderSent(supabase as any, '1', '2026-10-09T09:05:00.000Z')).resolves.toBeUndefined();
    expect(updatedWith).toEqual({ last_reminder_sent_at: '2026-10-09T09:05:00.000Z' });
  });

  it('markStageReminderSent throws on error', async () => {
    const supabase = makeSupabaseStub({ update: () => ({ eq: () => Promise.resolve({ error: { message: 'boom' } }) }) });
    await expect(markStageReminderSent(supabase as any, '1', '2026-10-09T09:05:00.000Z')).rejects.toThrow('boom');
  });
});
