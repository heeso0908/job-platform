'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/slack')
      .then((res) => res.json())
      .then((body) => setWebhookUrl(body.webhook_url ?? ''));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await fetch('/api/settings/slack', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl }),
    });
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>설정</h1>
      <label>
        Slack Webhook URL
        <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
      </label>
      <button type="submit">저장</button>
      {saved && <p>저장되었습니다.</p>}
    </form>
  );
}
