import { describe, it, expect, vi } from 'vitest';
import { getSlackWebhook, upsertSlackWebhook } from './slackWebhook';

function makeSupabaseStub(overrides: Record<string, any>) {
  return { from: vi.fn(() => overrides) };
}

describe('slack webhook data layer', () => {
  it('getSlackWebhook returns the url when a row exists', async () => {
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { webhook_url: 'https://hooks.slack.com/x' }, error: null }),
        }),
      }),
    });
    const result = await getSlackWebhook(supabase as any, 'user-1');
    expect(result).toBe('https://hooks.slack.com/x');
  });

  it('getSlackWebhook returns null when no row exists', async () => {
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    });
    const result = await getSlackWebhook(supabase as any, 'user-1');
    expect(result).toBeNull();
  });

  it('upsertSlackWebhook upserts the row', async () => {
    let upsertedWith: any = null;
    const supabase = makeSupabaseStub({
      upsert: (payload: any) => {
        upsertedWith = payload;
        return Promise.resolve({ error: null });
      },
    });
    await upsertSlackWebhook(supabase as any, 'user-1', 'https://hooks.slack.com/x');
    expect(upsertedWith).toEqual({ user_id: 'user-1', webhook_url: 'https://hooks.slack.com/x' });
  });
});
