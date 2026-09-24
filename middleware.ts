// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/signup', '/api/cron/reminders'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Cookie writes are batched and applied once, after getUser() finishes,
  // so that refreshing more than one cookie in a single request (the
  // normal case for access + refresh tokens) doesn't drop earlier writes
  // by rebuilding `response` on every call.
  const pendingCookies: { name: string; value: string; options: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options });
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '');
          pendingCookies.push({ name, value: '', options: { ...options, maxAge: 0 } });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const response = user
    ? NextResponse.next({ request })
    : NextResponse.redirect(new URL('/login', request.url));

  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
