import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendSlackMessage } from './slack';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendSlackMessage', () => {
  it('POSTs the text as JSON to the webhook URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await sendSlackMessage('https://hooks.slack.com/services/x', 'hello');

    expect(fetchMock).toHaveBeenCalledWith('https://hooks.slack.com/services/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'hello' }),
    });
  });

  it('throws when Slack responds with a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    await expect(sendSlackMessage('https://hooks.slack.com/services/x', 'hello')).rejects.toThrow('Slack webhook failed with status 400');
  });
});
