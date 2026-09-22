'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewApplicationPage() {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [memo, setMemo] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, position, apply_link: applyLink || null, memo: memo || null }),
    });
    const app = await res.json();
    router.push(`/applications/${app.id}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>새 공고 등록</h1>
      <input placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} required />
      <input placeholder="직무" value={position} onChange={(e) => setPosition(e.target.value)} required />
      <input placeholder="공고 링크" value={applyLink} onChange={(e) => setApplyLink(e.target.value)} />
      <textarea placeholder="메모" value={memo} onChange={(e) => setMemo(e.target.value)} />
      <button type="submit">등록</button>
    </form>
  );
}
