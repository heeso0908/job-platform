import { describe, it, expect } from 'vitest';
import { createPrompt, deletePrompt, listPrompts, updatePrompt } from './prompts';

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

const clientFor = (q: ReturnType<typeof makeQuery>) => ({ from: () => q.builder }) as any;

describe('listPrompts', () => {
  it('orders by category then most recently created', async () => {
    const q = makeQuery({ data: [{ id: '1' }] });
    expect(await listPrompts(clientFor(q))).toEqual([{ id: '1' }]);
    expect(q.calls).toContainEqual({ method: 'order', args: ['category', { ascending: true }] });
    expect(q.calls).toContainEqual({ method: 'order', args: ['created_at', { ascending: false }] });
  });

  it('throws on error', async () => {
    await expect(listPrompts(clientFor(makeQuery({ error: { message: 'boom' } })))).rejects.toThrow('boom');
  });
});

describe('createPrompt', () => {
  it('inserts with the user id and defaults', async () => {
    const q = makeQuery({ data: { id: 'new' } });
    await createPrompt(clientFor(q), 'user-1', { title: '지원동기 초안' });
    expect(q.calls.find((c) => c.method === 'insert')?.args[0]).toEqual({
      user_id: 'user-1',
      category: '기타',
      title: '지원동기 초안',
      content: '',
    });
  });

  it('accepts category and content', async () => {
    const q = makeQuery({ data: { id: 'new' } });
    await createPrompt(clientFor(q), 'user-1', { category: '지원동기', title: 't', content: '{{문항}} 에 답해줘' });
    expect(q.calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      category: '지원동기',
      content: '{{문항}} 에 답해줘',
    });
  });
});

describe('updatePrompt', () => {
  it('updates by id and returns the row', async () => {
    const q = makeQuery({ data: { id: 'p1' } });
    expect(await updatePrompt(clientFor(q), 'p1', { title: '새 제목' })).toEqual({ id: 'p1' });
    expect(q.calls).toContainEqual({ method: 'update', args: [{ title: '새 제목' }] });
    expect(q.calls).toContainEqual({ method: 'eq', args: ['id', 'p1'] });
  });
});

describe('deletePrompt', () => {
  it('deletes by id', async () => {
    const q = makeQuery({});
    await expect(deletePrompt(clientFor(q), 'p1')).resolves.toBeUndefined();
    expect(q.calls).toContainEqual({ method: 'eq', args: ['id', 'p1'] });
  });

  it('throws on error', async () => {
    await expect(deletePrompt(clientFor(makeQuery({ error: { message: 'nope' } })), 'p1')).rejects.toThrow('nope');
  });
});
