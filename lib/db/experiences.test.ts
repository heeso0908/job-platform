import { describe, it, expect } from 'vitest';
import { createExperience, deleteExperience, listExperiences, searchExperiences, updateExperience } from './experiences';

type Call = { method: string; args: unknown[] };

function makeQuery(result: { data?: unknown; error?: { message: string } | null }) {
  const calls: Call[] = [];
  const builder: any = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve({ data: result.data ?? null, error: result.error ?? null });
        }
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          return builder;
        };
      },
    }
  );
  return { builder, calls };
}

function makeSupabase(queries: ReturnType<typeof makeQuery>[]) {
  const queue = [...queries];
  return {
    from(table: string) {
      const next = queue.shift();
      if (!next) throw new Error(`unexpected query on ${table}`);
      return next.builder;
    },
  };
}

describe('listExperiences', () => {
  it('orders by most recently created', async () => {
    const q = makeQuery({ data: [{ id: '1' }] });
    const rows = await listExperiences(makeSupabase([q]) as any);
    expect(rows).toEqual([{ id: '1' }]);
    expect(q.calls).toContainEqual({ method: 'order', args: ['created_at', { ascending: false }] });
  });

  it('throws on error', async () => {
    await expect(listExperiences(makeSupabase([makeQuery({ error: { message: 'boom' } })]) as any)).rejects.toThrow('boom');
  });
});

describe('createExperience', () => {
  it('inserts with the given user id and defaults', async () => {
    const q = makeQuery({ data: { id: 'new' } });
    await createExperience(makeSupabase([q]) as any, 'user-1', { title: 'SK실트론' });
    const insert = q.calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toEqual({
      user_id: 'user-1',
      category: '기타',
      title: 'SK실트론',
      organization: null,
      period_start: null,
      period_end: null,
      summary: null,
      detail: '',
      tags: [],
      fields: {},
    });
  });

  it('accepts all fields when provided', async () => {
    const q = makeQuery({ data: { id: 'new' } });
    await createExperience(makeSupabase([q]) as any, 'user-1', {
      category: '경력',
      title: 'SK실트론',
      organization: 'Cleaning기술2팀',
      period_start: '2023-01-01',
      period_end: '2024-03-14',
      summary: 'Pro',
      detail: '불량률 감소',
      tags: ['품질'],
      fields: { department: 'Cleaning기술2팀', employment_type: '정규직' },
    });
    const insert = q.calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toMatchObject({
      category: '경력',
      organization: 'Cleaning기술2팀',
      tags: ['품질'],
      fields: { department: 'Cleaning기술2팀', employment_type: '정규직' },
    });
  });
});

describe('updateExperience', () => {
  it('updates by id and returns the row', async () => {
    const q = makeQuery({ data: { id: 'e1' } });
    const row = await updateExperience(makeSupabase([q]) as any, 'e1', { title: '새 제목' });
    expect(row).toEqual({ id: 'e1' });
    expect(q.calls).toContainEqual({ method: 'update', args: [{ title: '새 제목' }] });
    expect(q.calls).toContainEqual({ method: 'eq', args: ['id', 'e1'] });
  });
});

describe('deleteExperience', () => {
  it('deletes by id', async () => {
    const q = makeQuery({});
    await expect(deleteExperience(makeSupabase([q]) as any, 'e1')).resolves.toBeUndefined();
    expect(q.calls).toContainEqual({ method: 'eq', args: ['id', 'e1'] });
  });
});

describe('searchExperiences', () => {
  it('searches title and detail by keyword', async () => {
    const q = makeQuery({ data: [] });
    await searchExperiences(makeSupabase([q]) as any, { q: '협업' });
    expect(q.calls).toContainEqual({ method: 'or', args: ['title.ilike."%협업%",detail.ilike."%협업%"'] });
  });

  it('filters by category and tag', async () => {
    const q = makeQuery({ data: [] });
    await searchExperiences(makeSupabase([q]) as any, { category: '경력', tag: '품질' });
    expect(q.calls).toContainEqual({ method: 'eq', args: ['category', '경력'] });
    expect(q.calls).toContainEqual({ method: 'contains', args: ['tags', ['품질']] });
  });

  it('applies no filters when none are given', async () => {
    const q = makeQuery({ data: [] });
    await searchExperiences(makeSupabase([q]) as any, {});
    expect(q.calls.some((c) => c.method === 'or')).toBe(false);
    expect(q.calls.some((c) => c.method === 'eq')).toBe(false);
    expect(q.calls.some((c) => c.method === 'contains')).toBe(false);
  });
});
