'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/slack')
      .then(async (res) => {
        if (!res.ok) return;
        const body = await res.json();
        setWebhookUrl(body.webhook_url ?? '');
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    const res = await fetch('/api/settings/slack', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl }),
    });
    if (!res.ok) {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>설정</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Slack Webhook URL
        <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
      </label>
      <button type="submit">저장</button>
      {saved && <p>저장되었습니다.</p>}
    </form>
  );
}
