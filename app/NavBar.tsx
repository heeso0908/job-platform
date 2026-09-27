'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/dashboard', label: '홈' },
  { href: '/applications', label: '지원 공고' },
  { href: '/essays', label: '자소서' },
  { href: '/experiences', label: '경험' },
  { href: '/settings', label: '설정' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login' || pathname === '/signup') return null;

  async function handleLogout() {
    await createBrowserSupabaseClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center gap-0.5 overflow-x-auto px-3 py-3 sm:gap-1 sm:px-4">
        <Link href="/dashboard" className="mr-1 shrink-0 whitespace-nowrap text-base font-extrabold text-brand-600 sm:mr-3 sm:text-lg">잡플랫폼</Link>
        {LINKS.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 whitespace-nowrap rounded-xl px-2 py-2 text-sm font-semibold transition sm:px-3 ${active ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-100'}`}
            >
              {l.label}
            </Link>
          );
        })}
        <button type="button" onClick={handleLogout} className="ml-auto shrink-0 whitespace-nowrap rounded-xl px-2 py-2 text-sm font-semibold text-ink-400 hover:bg-ink-100 sm:px-3">
          로그아웃
        </button>
      </nav>
    </header>
  );
}
