import { describe, it, expect, vi } from 'vitest';
import { listStages, createStage, updateStage, deleteStage } from './stages';

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
      status: '예정',
      notes: null,
      slack_reminder_days_before: 1,
    });
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
});
