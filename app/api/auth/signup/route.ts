import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { isAllowedSignupEmail } from '@/lib/auth/allowedEmail';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 });
  }

  if (!isAllowedSignupEmail(email, process.env.ALLOWED_SIGNUP_EMAIL ?? '')) {
    return NextResponse.json({ error: '가입이 허용되지 않은 이메일입니다.' }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
