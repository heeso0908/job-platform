import { describe, it, expect } from 'vitest';
import {
  createEssays,
  deleteEssay,
  ilikeValue,
  listEssays,
  listTags,
  searchEssays,
  updateEssay,
} from './essays';

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

function makeSupabase(byTable: Record<string, ReturnType<typeof makeQuery>[]>) {
  const used: string[] = [];
  return {
    used,
    client: {
      from(table: string) {
        used.push(table);
        const next = byTable[table]?.shift();
        if (!next) throw new Error(`unexpected query on ${table}`);
        return next.builder;
      },
    },
  };
}

describe('ilikeValue', () => {
  it('wraps the keyword in wildcards and quotes', () => {
    expect(ilikeValue('협업')).toBe('"%협업%"');
  });

  it('escapes LIKE wildcards and PostgREST special characters', () => {
    expect(ilikeValue('100%_')).toBe('"%100\\\\%\\\\_%"');
    expect(ilikeValue('a"b,c)')).toBe('"%a\\"b,c)%"');
  });
});

describe('listEssays', () => {
  it('returns essays for an application ordered by position', async () => {
    const q = makeQuery({ data: [{ id: '1' }, { id: '2' }] });
    const { client } = makeSupabase({ essay_questions: [q] });
    const rows = await listEssays(client as any, 'app-1');
    expect(rows).toEqual([{ id: '1' }, { id: '2' }]);
    expect(q.calls).toContainEqual({ method: 'eq', args: ['application_id', 'app-1'] });
    expect(q.calls).toContainEqual({ method: 'order', args: ['position', { ascending: true }] });
  });

  it('throws on error', async () => {
    const { client } = makeSupabase({ essay_questions: [makeQuery({ error: { message: 'boom' } })] });
    await expect(listEssays(client as any, 'app-1')).rejects.toThrow('boom');
  });
});

describe('createEssays', () => {
  it('inserts rows with consecutive positions and defaults', async () => {
    const q = makeQuery({ data: [{ id: 'new' }] });
    const { client } = makeSupabase({ essay_questions: [q] });
    await createEssays(
      client as any,
      'app-1',
      [
        { question: '지원동기', charLimit: 500 },
        { question: '강점', charLimit: null },
      ],
      3
    );
    const insert = q.calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toEqual([
      { application_id: 'app-1', position: 3, question: '지원동기', char_limit: 500 },
      { application_id: 'app-1', position: 4, question: '강점', char_limit: null },
    ]);
  });

  it('does nothing for an empty list', async () => {
    const { client, used } = makeSupabase({});
    expect(await createEssays(client as any, 'app-1', [], 0)).toEqual([]);
    expect(used).toEqual([]);
  });
});

describe('updateEssay', () => {
  it('updates by id and returns the row', async () => {
    const q = makeQuery({ data: { id: 'e1', answer: '답' } });
    const { client } = makeSupabase({ essay_questions: [q] });
    const row = await updateEssay(client as any, 'e1', { answer: '답', tags: ['협업'] });
    expect(row).toEqual({ id: 'e1', answer: '답' });
    expect(q.calls).toContainEqual({ method: 'update', args: [{ answer: '답', tags: ['협업'] }] });
    expect(q.calls).toContainEqual({ method: 'eq', args: ['id', 'e1'] });
  });
});

describe('deleteEssay', () => {
  it('deletes by id', async () => {
    const q = makeQuery({});
    const { client } = makeSupabase({ essay_questions: [q] });
    await expect(deleteEssay(client as any, 'e1')).resolves.toBeUndefined();
    expect(q.calls).toContainEqual({ method: 'eq', args: ['id', 'e1'] });
  });
});

describe('searchEssays', () => {
  it('searches question, answer and the company/position of the application', async () => {
    const apps = makeQuery({ data: [{ id: 'a1' }, { id: 'a2' }] });
    const essays = makeQuery({ data: [{ id: 'e1' }] });
    const { client } = makeSupabase({ applications: [apps], essay_questions: [essays] });

    const rows = await searchEssays(client as any, { q: '협업' });

    expect(rows).toEqual([{ id: 'e1' }]);
    expect(apps.calls).toContainEqual({
      method: 'or',
      args: ['company.ilike."%협업%",position.ilike."%협업%"'],
    });
    expect(essays.calls).toContainEqual({
      method: 'or',
      args: ['question.ilike."%협업%",answer.ilike."%협업%",application_id.in.(a1,a2)'],
    });
  });

  it('skips the application id filter when no application matches', async () => {
    const apps = makeQuery({ data: [] });
    const essays = makeQuery({ data: [] });
    const { client } = makeSupabase({ applications: [apps], essay_questions: [essays] });

    await searchEssays(client as any, { q: '협업' });

    expect(essays.calls).toContainEqual({ method: 'or', args: ['question.ilike."%협업%",answer.ilike."%협업%"'] });
  });

  it('applies tag and submitted filters without a keyword', async () => {
    const essays = makeQuery({ data: [] });
    const { client, used } = makeSupabase({ essay_questions: [essays] });

    await searchEssays(client as any, { tag: '리더십', submittedOnly: true });

    expect(used).toEqual(['essay_questions']);
    expect(essays.calls).toContainEqual({ method: 'contains', args: ['tags', ['리더십']] });
    expect(essays.calls).toContainEqual({ method: 'not', args: ['submitted_at', 'is', null] });
    expect(essays.calls.some((c) => c.method === 'or')).toBe(false);
  });

  it('joins the application so results can show company and position', async () => {
    const essays = makeQuery({ data: [] });
    const { client } = makeSupabase({ essay_questions: [essays] });
    await searchEssays(client as any, {});
    const select = essays.calls.find((c) => c.method === 'select');
    expect(String(select?.args[0])).toContain('applications');
  });
});

describe('listTags', () => {
  it('returns unique tags sorted by how often they are used', async () => {
    const q = makeQuery({ data: [{ tags: ['협업', '리더십'] }, { tags: ['협업'] }, { tags: [] }, { tags: ['도전'] }] });
    const { client } = makeSupabase({ essay_questions: [q] });
    expect(await listTags(client as any)).toEqual([
      { tag: '협업', count: 2 },
      { tag: '도전', count: 1 },
      { tag: '리더십', count: 1 },
    ]);
  });
});
