import { describe, it, expect, vi } from 'vitest';
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} from './applications';

function makeSupabaseStub(overrides: Record<string, any>) {
  return { from: vi.fn(() => overrides) };
}

describe('applications data layer', () => {
  it('listApplications returns ordered rows', async () => {
    const rows = [{ id: '1' }, { id: '2' }];
    const supabase = makeSupabaseStub({
      select: () => ({
        order: () => Promise.resolve({ data: rows, error: null }),
      }),
    });
    const result = await listApplications(supabase as any);
    expect(result).toEqual(rows);
  });

  it('listApplications throws on error', async () => {
    const supabase = makeSupabaseStub({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
      }),
    });
    await expect(listApplications(supabase as any)).rejects.toThrow('boom');
  });

  it('getApplication returns a single row', async () => {
    const row = { id: '1', company: 'Acme' };
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    });
    const result = await getApplication(supabase as any, '1');
    expect(result).toEqual(row);
  });

  it('createApplication inserts with defaults and returns the row', async () => {
    const created = { id: '1', company: 'Acme', position: 'SWE', status: '지원예정' };
    let insertedWith: any = null;
    const supabase = makeSupabaseStub({
      insert: (payload: any) => {
        insertedWith = payload;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: created, error: null }),
          }),
        };
      },
    });
    const result = await createApplication(supabase as any, 'user-1', {
      company: 'Acme',
      position: 'SWE',
    });
    expect(result).toEqual(created);
    expect(insertedWith).toEqual({
      user_id: 'user-1',
      company: 'Acme',
      position: 'SWE',
      apply_link: null,
      memo: null,
      status: '지원예정',
    });
  });

  it('updateApplication updates the row by id', async () => {
    const updated = { id: '1', company: 'New Name' };
    const supabase = makeSupabaseStub({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updated, error: null }),
          }),
        }),
      }),
    });
    const result = await updateApplication(supabase as any, '1', { company: 'New Name' });
    expect(result).toEqual(updated);
  });

  it('deleteApplication deletes the row by id', async () => {
    const supabase = makeSupabaseStub({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });
    await expect(deleteApplication(supabase as any, '1')).resolves.toBeUndefined();
  });
});
