'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? '가입에 실패했습니다.');
      return;
    }
    router.push('/login');
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div className="space-y-1 pb-2">
          <h1 className="text-2xl font-extrabold">회원가입</h1>
          <p className="text-sm text-ink-500">허용된 이메일로만 가입할 수 있어요</p>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <input className="input" type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn w-full">가입하기</button>
        <p className="text-center text-sm text-ink-500">
          <Link href="/login" className="font-semibold text-brand-600">이미 계정이 있나요? 로그인</Link>
        </p>
      </form>
    </main>
  );
}
