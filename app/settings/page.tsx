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
    <main className="pt-4">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="space-y-1 pb-2">
          <h1 className="text-2xl font-extrabold">설정</h1>
          <p className="text-sm text-ink-500">전형 일정 알림을 Slack으로 받아요</p>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">Slack Webhook URL</span>
          <input
            className="input"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
          />
        </label>
        <button type="submit" className="btn w-full">
          저장
        </button>
        {saved && <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">저장되었어요.</p>}
      </form>
    </main>
  );
}
