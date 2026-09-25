'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div className="space-y-1 pb-2">
          <h1 className="text-2xl font-extrabold">로그인</h1>
          <p className="text-sm text-ink-500">이메일과 비밀번호를 입력해주세요</p>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <input className="input" type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn w-full">로그인</button>
        <p className="text-center text-sm text-ink-500">
          <Link href="/signup" className="font-semibold text-brand-600">처음이신가요? 회원가입</Link>
        </p>
      </form>
    </main>
  );
}
