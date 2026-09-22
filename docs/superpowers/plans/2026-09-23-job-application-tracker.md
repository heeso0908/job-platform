# Job Application Tracker (Sub-project A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-tenant Next.js app for tracking job applications and their interview-process stages (서류/인적성/면접), with Slack reminders sent by a Vercel Cron job.

**Architecture:** Next.js App Router (TypeScript) with API routes as thin wrappers around a `lib/db/*` data-access layer that takes a Supabase client as a parameter (so it can be unit-tested with a fake client). Supabase Postgres + Auth provides storage and login; RLS policies enforce per-user row isolation as defense in depth. Signup is restricted in application code to one allowed email read from an environment variable. A Vercel Cron job hits a secret-protected API route daily; that route computes which stages need a reminder and posts to the user's registered Slack Incoming Webhook.

**Tech Stack:** Next.js 14 (App Router, TypeScript), @supabase/supabase-js + @supabase/ssr, Vitest for unit tests, deployed to Vercel with Vercel Cron.

**Spec:** [docs/superpowers/specs/2026-09-23-job-application-tracker-design.md](../specs/2026-09-23-job-application-tracker-design.md)

## Global Constraints

- Single-tenant per deployment: one Supabase project + one Vercel project = one user. No multi-tenant sharing of a single deployment.
- Signup is restricted to the email in `ALLOWED_SIGNUP_EMAIL`; no other email may create an account.
- RLS must be enabled on every table so `auth.uid() = user_id` is enforced even if the email restriction is bypassed.
- Slack reminder timing: a stage's reminder fires when `scheduled_at`'s date minus `slack_reminder_days_before` days equals today (Vercel Cron server date, treated as the deployment's local day boundary at midnight).
- Stage types (`서류`/`인적성`/`면접`/etc.) are free-text, not an enum — a table with no fixed set of stages, so no ordering constraint is enforced.
- The cron endpoint must reject requests that don't present the correct `CRON_SECRET` bearer token.

---

## File Structure

```
package.json
tsconfig.json
next.config.js
vitest.config.ts
vercel.json
.env.local.example
middleware.ts                          # route protection
supabase/migrations/0001_init.sql      # schema + RLS

lib/supabase/client.ts                 # browser client
lib/supabase/server.ts                 # server (cookie-bound) client
lib/supabase/admin.ts                  # service-role client (cron, signup)

lib/auth/allowedEmail.ts               # pure fn: isAllowedSignupEmail
lib/auth/allowedEmail.test.ts

lib/db/applications.ts                 # CRUD for applications
lib/db/applications.test.ts
lib/db/stages.ts                       # CRUD for application_stages
lib/db/stages.test.ts
lib/db/slackWebhook.ts                 # get/upsert slack webhook
lib/db/slackWebhook.test.ts

lib/reminders.ts                       # isReminderDue, findDueReminders
lib/reminders.test.ts
lib/slack.ts                           # sendSlackMessage
lib/slack.test.ts

app/layout.tsx
app/page.tsx                           # redirect to /dashboard or /login

app/login/page.tsx
app/signup/page.tsx
app/api/auth/signup/route.ts

app/api/applications/route.ts          # GET list, POST create
app/api/applications/[id]/route.ts     # GET one, PATCH update, DELETE
app/api/applications/[id]/stages/route.ts   # GET list, POST create (scoped to application)
app/api/stages/[id]/route.ts           # PATCH update, DELETE

app/api/settings/slack/route.ts        # GET, PUT
app/api/cron/reminders/route.ts        # GET, cron-secret protected

app/dashboard/page.tsx
app/applications/page.tsx
app/applications/new/page.tsx
app/applications/[id]/page.tsx
app/settings/page.tsx

README.md                              # setup + deployment instructions
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `vitest.config.ts`, `.env.local.example`, `.gitignore`
- Create: `app/layout.tsx`, `app/page.tsx` (placeholder)
- Test: `lib/sanity.test.ts`

**Interfaces:**
- Produces: a working `npm run dev` (Next.js) and `npm test` (Vitest) setup that every later task builds on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "job-application-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.4",
    "next": "^14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_SIGNUP_EMAIL=you@example.com
CRON_SECRET=change-me
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.next
.env.local
```

- [ ] **Step 7: Create placeholder `app/layout.tsx`**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder `app/page.tsx`**

```tsx
export default function Home() {
  return <p>Job Application Tracker</p>;
}
```

- [ ] **Step 9: Write a sanity test**

```ts
// lib/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 10: Install dependencies and run the test**

Run: `npm install && npm test`
Expected: the sanity test passes.

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json next.config.js vitest.config.ts .env.local.example .gitignore app/layout.tsx app/page.tsx lib/sanity.test.ts package-lock.json
git commit -m "chore: scaffold Next.js + Vitest project"
```

---

### Task 2: Supabase schema, RLS, and client helpers

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`

**Interfaces:**
- Consumes: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Produces: `createBrowserSupabaseClient()`, `createServerSupabaseClient()`, `createAdminSupabaseClient()` — all later tasks get their Supabase client from one of these three.

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/0001_init.sql

create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  position text not null,
  apply_link text,
  memo text,
  status text not null default '지원예정',
  created_at timestamptz not null default now()
);

create table application_stages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  stage_type text not null,
  scheduled_at timestamptz not null,
  status text not null default '예정',
  notes text,
  slack_reminder_days_before int not null default 1
);

create table slack_webhooks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  webhook_url text not null
);

alter table applications enable row level security;
alter table application_stages enable row level security;
alter table slack_webhooks enable row level security;

create policy "applications_owner_all" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "stages_owner_all" on application_stages
  for all using (
    exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid())
  );

create policy "slack_webhooks_owner_all" on slack_webhooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: Create the browser client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create the server (cookie-bound) client**

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}
```

- [ ] **Step 4: Create the admin (service-role) client**

```ts
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 5: Run the existing test suite to confirm nothing broke**

Run: `npm test`
Expected: sanity test still passes (these files have no automated test — they're thin SDK wrappers exercised by later tasks and verified manually against a real Supabase project in Task 14).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_init.sql lib/supabase/client.ts lib/supabase/server.ts lib/supabase/admin.ts
git commit -m "feat: add Supabase schema, RLS policies, and client helpers"
```

---

### Task 3: Allowed-email signup restriction + signup/login

**Files:**
- Create: `lib/auth/allowedEmail.ts`, `lib/auth/allowedEmail.test.ts`
- Create: `app/api/auth/signup/route.ts`
- Create: `app/signup/page.tsx`, `app/login/page.tsx`

**Interfaces:**
- Produces: `isAllowedSignupEmail(email: string, allowedEmail: string): boolean` — pure function, used by the signup route.

- [ ] **Step 1: Write the failing test**

```ts
// lib/auth/allowedEmail.test.ts
import { describe, it, expect } from 'vitest';
import { isAllowedSignupEmail } from './allowedEmail';

describe('isAllowedSignupEmail', () => {
  it('allows an exact case-insensitive match', () => {
    expect(isAllowedSignupEmail('You@Example.com', 'you@example.com')).toBe(true);
  });

  it('rejects a different email', () => {
    expect(isAllowedSignupEmail('other@example.com', 'you@example.com')).toBe(false);
  });

  it('rejects when allowedEmail is empty', () => {
    expect(isAllowedSignupEmail('you@example.com', '')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/allowedEmail.test.ts`
Expected: FAIL — `isAllowedSignupEmail` is not defined / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/auth/allowedEmail.ts
export function isAllowedSignupEmail(email: string, allowedEmail: string): boolean {
  if (!allowedEmail) return false;
  return email.trim().toLowerCase() === allowedEmail.trim().toLowerCase();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/auth/allowedEmail.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Create the signup API route**

```ts
// app/api/auth/signup/route.ts
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
```

- [ ] **Step 6: Create the signup page**

```tsx
// app/signup/page.tsx
'use client';

import { useState } from 'react';
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
    <form onSubmit={handleSubmit}>
      <h1>회원가입</h1>
      {error && <p role="alert">{error}</p>}
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">가입하기</button>
    </form>
  );
}
```

- [ ] **Step 7: Create the login page**

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
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
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>로그인</h1>
      {error && <p role="alert">{error}</p>}
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">로그인</button>
    </form>
  );
}
```

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the 3 new `allowedEmail` tests.

- [ ] **Step 9: Commit**

```bash
git add lib/auth/allowedEmail.ts lib/auth/allowedEmail.test.ts app/api/auth/signup/route.ts app/signup/page.tsx app/login/page.tsx
git commit -m "feat: restrict signup to one allowed email, add login/signup pages"
```

---

### Task 4: Route protection middleware

**Files:**
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient` pattern (reimplemented for Edge middleware using `@supabase/ssr`'s `createServerClient` directly, since `next/headers` cookies() isn't available in middleware).
- Produces: redirects unauthenticated requests to `/login` for every route except `/login`, `/signup`, `/api/auth/signup`, `/api/cron/reminders`, and Next static assets.

- [ ] **Step 1: Write `middleware.ts`**

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/signup', '/api/cron/reminders'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all existing tests still pass (middleware has no automated test — it's a Next.js Edge runtime construct verified manually in Task 14 by hitting a protected route while logged out).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect all routes behind Supabase auth except login/signup/cron"
```

---

### Task 5: Applications data layer

**Files:**
- Create: `lib/db/applications.ts`, `lib/db/applications.test.ts`

**Interfaces:**
- Consumes: any Supabase-client-shaped object exposing `.from(table)`.
- Produces:
  - `interface Application { id: string; user_id: string; company: string; position: string; apply_link: string | null; memo: string | null; status: string; created_at: string; }`
  - `listApplications(supabase): Promise<Application[]>`
  - `getApplication(supabase, id: string): Promise<Application | null>`
  - `createApplication(supabase, userId: string, input: { company: string; position: string; apply_link?: string | null; memo?: string | null; status?: string }): Promise<Application>`
  - `updateApplication(supabase, id: string, input: Partial<{ company: string; position: string; apply_link: string | null; memo: string | null; status: string }>): Promise<Application>`
  - `deleteApplication(supabase, id: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/db/applications.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} from './applications';

function makeSupabaseStub(overrides: Record<string, any>) {
  return { from: vi.fn(() => overrides) };
}

describe('applications data layer', () => {
  it('listApplications returns ordered rows', async () => {
    const rows = [{ id: '1' }, { id: '2' }];
    const supabase = makeSupabaseStub({
      select: () => ({
        order: () => Promise.resolve({ data: rows, error: null }),
      }),
    });
    const result = await listApplications(supabase as any);
    expect(result).toEqual(rows);
  });

  it('listApplications throws on error', async () => {
    const supabase = makeSupabaseStub({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
      }),
    });
    await expect(listApplications(supabase as any)).rejects.toThrow('boom');
  });

  it('getApplication returns a single row', async () => {
    const row = { id: '1', company: 'Acme' };
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    });
    const result = await getApplication(supabase as any, '1');
    expect(result).toEqual(row);
  });

  it('createApplication inserts with defaults and returns the row', async () => {
    const created = { id: '1', company: 'Acme', position: 'SWE', status: '지원예정' };
    let insertedWith: any = null;
    const supabase = makeSupabaseStub({
      insert: (payload: any) => {
        insertedWith = payload;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: created, error: null }),
          }),
        };
      },
    });
    const result = await createApplication(supabase as any, 'user-1', {
      company: 'Acme',
      position: 'SWE',
    });
    expect(result).toEqual(created);
    expect(insertedWith).toEqual({
      user_id: 'user-1',
      company: 'Acme',
      position: 'SWE',
      apply_link: null,
      memo: null,
      status: '지원예정',
    });
  });

  it('updateApplication updates the row by id', async () => {
    const updated = { id: '1', company: 'New Name' };
    const supabase = makeSupabaseStub({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updated, error: null }),
          }),
        }),
      }),
    });
    const result = await updateApplication(supabase as any, '1', { company: 'New Name' });
    expect(result).toEqual(updated);
  });

  it('deleteApplication deletes the row by id', async () => {
    const supabase = makeSupabaseStub({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });
    await expect(deleteApplication(supabase as any, '1')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/db/applications.test.ts`
Expected: FAIL — module `./applications` not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/db/applications.ts
export interface Application {
  id: string;
  user_id: string;
  company: string;
  position: string;
  apply_link: string | null;
  memo: string | null;
  status: string;
  created_at: string;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  apply_link?: string | null;
  memo?: string | null;
  status?: string;
}

export type UpdateApplicationInput = Partial<{
  company: string;
  position: string;
  apply_link: string | null;
  memo: string | null;
  status: string;
}>;

export async function listApplications(supabase: any): Promise<Application[]> {
  const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getApplication(supabase: any, id: string): Promise<Application | null> {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createApplication(
  supabase: any,
  userId: string,
  input: CreateApplicationInput
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company: input.company,
      position: input.position,
      apply_link: input.apply_link ?? null,
      memo: input.memo ?? null,
      status: input.status ?? '지원예정',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateApplication(
  supabase: any,
  id: string,
  input: UpdateApplicationInput
): Promise<Application> {
  const { data, error } = await supabase.from('applications').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteApplication(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/db/applications.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/db/applications.ts lib/db/applications.test.ts
git commit -m "feat: add applications data access layer"
```

---

### Task 6: Applications API routes + UI pages

**Files:**
- Create: `app/api/applications/route.ts`, `app/api/applications/[id]/route.ts`
- Create: `app/applications/page.tsx`, `app/applications/new/page.tsx`, `app/applications/[id]/page.tsx`

**Interfaces:**
- Consumes: `listApplications`, `getApplication`, `createApplication`, `updateApplication`, `deleteApplication` from Task 5; `createServerSupabaseClient` from Task 2.
- Produces: `GET/POST /api/applications`, `GET/PATCH/DELETE /api/applications/:id` JSON endpoints used by the UI pages and, later, by Task 8's stage UI.

- [ ] **Step 1: Create the collection route**

```ts
// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications, createApplication } from '@/lib/db/applications';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const apps = await listApplications(supabase);
  return NextResponse.json(apps);
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const app = await createApplication(supabase, user.id, body);
  return NextResponse.json(app, { status: 201 });
}
```

- [ ] **Step 2: Create the item route**

```ts
// app/api/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication, updateApplication, deleteApplication } from '@/lib/db/applications';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(app);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const app = await updateApplication(supabase, params.id, body);
  return NextResponse.json(app);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deleteApplication(supabase, params.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create the applications list page**

```tsx
// app/applications/page.tsx
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications } from '@/lib/db/applications';

export default async function ApplicationsPage() {
  const supabase = createServerSupabaseClient();
  const apps = await listApplications(supabase);

  return (
    <main>
      <h1>지원 공고</h1>
      <Link href="/applications/new">+ 새 공고</Link>
      <ul>
        {apps.map((app) => (
          <li key={app.id}>
            <Link href={`/applications/${app.id}`}>
              {app.company} — {app.position} ({app.status})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 4: Create the new-application page**

```tsx
// app/applications/new/page.tsx
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
```

- [ ] **Step 5: Create the application detail page (stage timeline wired in Task 8)**

```tsx
// app/applications/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication } from '@/lib/db/applications';
import { notFound } from 'next/navigation';

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) notFound();

  return (
    <main>
      <h1>{app.company} — {app.position}</h1>
      <p>상태: {app.status}</p>
      {app.apply_link && <p><a href={app.apply_link}>공고 링크</a></p>}
      {app.memo && <p>{app.memo}</p>}
      <section id="stages">
        <h2>전형 단계</h2>
        {/* Stage list/form added in Task 8 */}
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests still pass (routes/pages verified manually against a real Supabase project in Task 14; they're thin wrappers around the already-tested `lib/db/applications.ts`).

- [ ] **Step 7: Commit**

```bash
git add app/api/applications app/applications
git commit -m "feat: add applications API routes and list/new/detail pages"
```

---

### Task 7: Stages data layer

**Files:**
- Create: `lib/db/stages.ts`, `lib/db/stages.test.ts`

**Interfaces:**
- Consumes: any Supabase-client-shaped object exposing `.from(table)`.
- Produces:
  - `interface ApplicationStage { id: string; application_id: string; stage_type: string; scheduled_at: string; status: string; notes: string | null; slack_reminder_days_before: number; }`
  - `listStages(supabase, applicationId: string): Promise<ApplicationStage[]>`
  - `createStage(supabase, applicationId: string, input: { stage_type: string; scheduled_at: string; status?: string; notes?: string | null; slack_reminder_days_before?: number }): Promise<ApplicationStage>`
  - `updateStage(supabase, id: string, input: Partial<{ stage_type: string; scheduled_at: string; status: string; notes: string | null; slack_reminder_days_before: number }>): Promise<ApplicationStage>`
  - `deleteStage(supabase, id: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/db/stages.test.ts
import { describe, it, expect, vi } from 'vitest';
import { listStages, createStage, updateStage, deleteStage } from './stages';

function makeSupabaseStub(overrides: Record<string, any>) {
  return { from: vi.fn(() => overrides) };
}

describe('stages data layer', () => {
  it('listStages returns rows ordered by scheduled_at', async () => {
    const rows = [{ id: '1' }, { id: '2' }];
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    });
    const result = await listStages(supabase as any, 'app-1');
    expect(result).toEqual(rows);
  });

  it('createStage inserts with defaults', async () => {
    const created = { id: '1', stage_type: '서류', status: '예정' };
    let insertedWith: any = null;
    const supabase = makeSupabaseStub({
      insert: (payload: any) => {
        insertedWith = payload;
        return { select: () => ({ single: () => Promise.resolve({ data: created, error: null }) }) };
      },
    });
    const result = await createStage(supabase as any, 'app-1', {
      stage_type: '서류',
      scheduled_at: '2026-10-01T00:00:00.000Z',
    });
    expect(result).toEqual(created);
    expect(insertedWith).toEqual({
      application_id: 'app-1',
      stage_type: '서류',
      scheduled_at: '2026-10-01T00:00:00.000Z',
      status: '예정',
      notes: null,
      slack_reminder_days_before: 1,
    });
  });

  it('updateStage updates by id', async () => {
    const updated = { id: '1', status: '완료' };
    const supabase = makeSupabaseStub({
      update: () => ({
        eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: updated, error: null }) }) }),
      }),
    });
    const result = await updateStage(supabase as any, '1', { status: '완료' });
    expect(result).toEqual(updated);
  });

  it('deleteStage deletes by id', async () => {
    const supabase = makeSupabaseStub({ delete: () => ({ eq: () => Promise.resolve({ error: null }) }) });
    await expect(deleteStage(supabase as any, '1')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/db/stages.test.ts`
Expected: FAIL — module `./stages` not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/db/stages.ts
export interface ApplicationStage {
  id: string;
  application_id: string;
  stage_type: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  slack_reminder_days_before: number;
}

export interface CreateStageInput {
  stage_type: string;
  scheduled_at: string;
  status?: string;
  notes?: string | null;
  slack_reminder_days_before?: number;
}

export type UpdateStageInput = Partial<{
  stage_type: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  slack_reminder_days_before: number;
}>;

export async function listStages(supabase: any, applicationId: string): Promise<ApplicationStage[]> {
  const { data, error } = await supabase
    .from('application_stages')
    .select('*')
    .eq('application_id', applicationId)
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createStage(
  supabase: any,
  applicationId: string,
  input: CreateStageInput
): Promise<ApplicationStage> {
  const { data, error } = await supabase
    .from('application_stages')
    .insert({
      application_id: applicationId,
      stage_type: input.stage_type,
      scheduled_at: input.scheduled_at,
      status: input.status ?? '예정',
      notes: input.notes ?? null,
      slack_reminder_days_before: input.slack_reminder_days_before ?? 1,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateStage(supabase: any, id: string, input: UpdateStageInput): Promise<ApplicationStage> {
  const { data, error } = await supabase.from('application_stages').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteStage(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('application_stages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/db/stages.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/db/stages.ts lib/db/stages.test.ts
git commit -m "feat: add application stages data access layer"
```

---

### Task 8: Stages API routes + timeline UI

**Files:**
- Create: `app/api/applications/[id]/stages/route.ts`, `app/api/stages/[id]/route.ts`
- Modify: `app/applications/[id]/page.tsx` — replace the empty `#stages` section with a real timeline + add-stage form

**Interfaces:**
- Consumes: `listStages`, `createStage`, `updateStage`, `deleteStage` from Task 7.
- Produces: `GET/POST /api/applications/:id/stages`, `PATCH/DELETE /api/stages/:id`.

- [ ] **Step 1: Create the stage collection route**

```ts
// app/api/applications/[id]/stages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listStages, createStage } from '@/lib/db/stages';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const stages = await listStages(supabase, params.id);
  return NextResponse.json(stages);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const stage = await createStage(supabase, params.id, body);
  return NextResponse.json(stage, { status: 201 });
}
```

- [ ] **Step 2: Create the stage item route**

```ts
// app/api/stages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateStage, deleteStage } from '@/lib/db/stages';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const stage = await updateStage(supabase, params.id, body);
  return NextResponse.json(stage);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  await deleteStage(supabase, params.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create the client-side stage timeline component**

```tsx
// app/applications/[id]/StageTimeline.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStage } from '@/lib/db/stages';

export default function StageTimeline({ applicationId, stages }: { applicationId: string; stages: ApplicationStage[] }) {
  const [stageType, setStageType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/applications/${applicationId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_type: stageType, scheduled_at: new Date(scheduledAt).toISOString() }),
    });
    setStageType('');
    setScheduledAt('');
    router.refresh();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/stages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/stages/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div>
      <ul>
        {stages.map((stage) => (
          <li key={stage.id}>
            {stage.stage_type} — {new Date(stage.scheduled_at).toLocaleString('ko-KR')} —
            <select value={stage.status} onChange={(e) => handleStatusChange(stage.id, e.target.value)}>
              <option value="예정">예정</option>
              <option value="완료">완료</option>
              <option value="통과">통과</option>
              <option value="탈락">탈락</option>
            </select>
            <button type="button" onClick={() => handleDelete(stage.id)}>삭제</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd}>
        <input placeholder="단계 (예: 서류, 1차면접)" value={stageType} onChange={(e) => setStageType(e.target.value)} required />
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        <button type="submit">단계 추가</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Wire the timeline into the detail page**

```tsx
// app/applications/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApplication } from '@/lib/db/applications';
import { listStages } from '@/lib/db/stages';
import { notFound } from 'next/navigation';
import StageTimeline from './StageTimeline';

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const app = await getApplication(supabase, params.id);
  if (!app) notFound();
  const stages = await listStages(supabase, params.id);

  return (
    <main>
      <h1>{app.company} — {app.position}</h1>
      <p>상태: {app.status}</p>
      {app.apply_link && <p><a href={app.apply_link}>공고 링크</a></p>}
      {app.memo && <p>{app.memo}</p>}
      <section>
        <h2>전형 단계</h2>
        <StageTimeline applicationId={app.id} stages={stages} />
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests still pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/applications/[id]/stages app/api/stages app/applications/[id]
git commit -m "feat: add stage API routes and timeline UI"
```

---

### Task 9: Slack webhook data layer + settings page

**Files:**
- Create: `lib/db/slackWebhook.ts`, `lib/db/slackWebhook.test.ts`
- Create: `app/api/settings/slack/route.ts`, `app/settings/page.tsx`

**Interfaces:**
- Produces:
  - `getSlackWebhook(supabase, userId: string): Promise<string | null>`
  - `upsertSlackWebhook(supabase, userId: string, webhookUrl: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/db/slackWebhook.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getSlackWebhook, upsertSlackWebhook } from './slackWebhook';

function makeSupabaseStub(overrides: Record<string, any>) {
  return { from: vi.fn(() => overrides) };
}

describe('slack webhook data layer', () => {
  it('getSlackWebhook returns the url when a row exists', async () => {
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { webhook_url: 'https://hooks.slack.com/x' }, error: null }),
        }),
      }),
    });
    const result = await getSlackWebhook(supabase as any, 'user-1');
    expect(result).toBe('https://hooks.slack.com/x');
  });

  it('getSlackWebhook returns null when no row exists', async () => {
    const supabase = makeSupabaseStub({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    });
    const result = await getSlackWebhook(supabase as any, 'user-1');
    expect(result).toBeNull();
  });

  it('upsertSlackWebhook upserts the row', async () => {
    let upsertedWith: any = null;
    const supabase = makeSupabaseStub({
      upsert: (payload: any) => {
        upsertedWith = payload;
        return Promise.resolve({ error: null });
      },
    });
    await upsertSlackWebhook(supabase as any, 'user-1', 'https://hooks.slack.com/x');
    expect(upsertedWith).toEqual({ user_id: 'user-1', webhook_url: 'https://hooks.slack.com/x' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/db/slackWebhook.test.ts`
Expected: FAIL — module `./slackWebhook` not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/db/slackWebhook.ts
export async function getSlackWebhook(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('slack_webhooks')
    .select('webhook_url')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.webhook_url ?? null;
}

export async function upsertSlackWebhook(supabase: any, userId: string, webhookUrl: string): Promise<void> {
  const { error } = await supabase.from('slack_webhooks').upsert({ user_id: userId, webhook_url: webhookUrl });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/db/slackWebhook.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Create the settings API route**

```ts
// app/api/settings/slack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSlackWebhook, upsertSlackWebhook } from '@/lib/db/slackWebhook';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhookUrl = await getSlackWebhook(supabase, user.id);
  return NextResponse.json({ webhook_url: webhookUrl });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { webhook_url } = await request.json();
  await upsertSlackWebhook(supabase, user.id, webhook_url);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Create the settings page**

```tsx
// app/settings/page.tsx
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
```

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/db/slackWebhook.ts lib/db/slackWebhook.test.ts app/api/settings/slack app/settings/page.tsx
git commit -m "feat: add Slack webhook settings"
```

---

### Task 10: Reminder date-calculation logic

**Files:**
- Create: `lib/reminders.ts`, `lib/reminders.test.ts`

**Interfaces:**
- Consumes: any Supabase-client-shaped object exposing `.from(table)`.
- Produces:
  - `interface DueReminder { stageId: string; stageType: string; scheduledAt: string; company: string; position: string; userId: string; }`
  - `isReminderDue(scheduledAt: Date, daysBefore: number, today: Date): boolean`
  - `findDueReminders(supabase, today: Date): Promise<DueReminder[]>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/reminders.test.ts
import { describe, it, expect, vi } from 'vitest';
import { isReminderDue, findDueReminders } from './reminders';

describe('isReminderDue', () => {
  it('is true when today is exactly daysBefore days before the scheduled date', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-09T02:00:00Z');
    expect(isReminderDue(scheduled, 1, today)).toBe(true);
  });

  it('is false when today is two days before but daysBefore is 1', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-08T02:00:00Z');
    expect(isReminderDue(scheduled, 1, today)).toBe(false);
  });

  it('is true for daysBefore = 0 on the scheduled date itself', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-10T23:00:00Z');
    expect(isReminderDue(scheduled, 0, today)).toBe(true);
  });

  it('is false after the reminder date has passed', () => {
    const scheduled = new Date('2026-10-10T15:00:00Z');
    const today = new Date('2026-10-10T02:00:00Z');
    expect(isReminderDue(scheduled, 1, today)).toBe(false);
  });
});

describe('findDueReminders', () => {
  it('filters stages to only those due today and maps them to DueReminder', async () => {
    const rows = [
      {
        id: 'stage-1',
        stage_type: '서류',
        scheduled_at: '2026-10-10T15:00:00.000Z',
        slack_reminder_days_before: 1,
        applications: { id: 'app-1', company: 'Acme', position: 'SWE', user_id: 'user-1' },
      },
      {
        id: 'stage-2',
        stage_type: '면접',
        scheduled_at: '2026-11-01T15:00:00.000Z',
        slack_reminder_days_before: 1,
        applications: { id: 'app-2', company: 'Globex', position: 'PM', user_id: 'user-1' },
      },
    ];
    const supabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: rows, error: null }),
        }),
      })),
    };
    const today = new Date('2026-10-09T02:00:00Z');
    const result = await findDueReminders(supabase as any, today);
    expect(result).toEqual([
      {
        stageId: 'stage-1',
        stageType: '서류',
        scheduledAt: '2026-10-10T15:00:00.000Z',
        company: 'Acme',
        position: 'SWE',
        userId: 'user-1',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/reminders.test.ts`
Expected: FAIL — module `./reminders` not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/reminders.ts
export interface DueReminder {
  stageId: string;
  stageType: string;
  scheduledAt: string;
  company: string;
  position: string;
  userId: string;
}

function toMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isReminderDue(scheduledAt: Date, daysBefore: number, today: Date): boolean {
  const scheduledMidnight = toMidnightUTC(scheduledAt);
  const reminderDate = new Date(scheduledMidnight);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - daysBefore);
  const todayMidnight = toMidnightUTC(today);
  return reminderDate.getTime() === todayMidnight.getTime();
}

export async function findDueReminders(supabase: any, today: Date): Promise<DueReminder[]> {
  const { data, error } = await supabase.from('application_stages').select('id, stage_type, scheduled_at, slack_reminder_days_before, applications(id, company, position, user_id)').eq('status', '예정');
  if (error) throw new Error(error.message);

  return (data as any[])
    .filter((row) => isReminderDue(new Date(row.scheduled_at), row.slack_reminder_days_before, today))
    .map((row) => ({
      stageId: row.id,
      stageType: row.stage_type,
      scheduledAt: row.scheduled_at,
      company: row.applications.company,
      position: row.applications.position,
      userId: row.applications.user_id,
    }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/reminders.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/reminders.ts lib/reminders.test.ts
git commit -m "feat: add reminder due-date calculation logic"
```

---

### Task 11: Slack message sending

**Files:**
- Create: `lib/slack.ts`, `lib/slack.test.ts`

**Interfaces:**
- Produces: `sendSlackMessage(webhookUrl: string, text: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/slack.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/slack.test.ts`
Expected: FAIL — module `./slack` not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/slack.ts
export async function sendSlackMessage(webhookUrl: string, text: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook failed with status ${response.status}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/slack.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/slack.ts lib/slack.test.ts
git commit -m "feat: add Slack message sending helper"
```

---

### Task 12: Cron reminder endpoint

**Files:**
- Create: `app/api/cron/reminders/route.ts`, `vercel.json`

**Interfaces:**
- Consumes: `findDueReminders` (Task 10), `getSlackWebhook` (Task 9), `sendSlackMessage` (Task 11), `createAdminSupabaseClient` (Task 2).
- Produces: `GET /api/cron/reminders`, protected by `CRON_SECRET`.

- [ ] **Step 1: Write the cron route**

```ts
// app/api/cron/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { findDueReminders } from '@/lib/reminders';
import { getSlackWebhook } from '@/lib/db/slackWebhook';
import { sendSlackMessage } from '@/lib/slack';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const dueReminders = await findDueReminders(supabase, new Date());

  let sentCount = 0;
  for (const reminder of dueReminders) {
    const webhookUrl = await getSlackWebhook(supabase, reminder.userId);
    if (!webhookUrl) continue;
    const scheduledDate = new Date(reminder.scheduledAt).toLocaleDateString('ko-KR');
    await sendSlackMessage(
      webhookUrl,
      `[${reminder.company}] ${reminder.position} — ${reminder.stageType} 일정이 ${scheduledDate}입니다.`
    );
    sentCount += 1;
  }

  return NextResponse.json({ checked: dueReminders.length, sent: sentCount });
}
```

- [ ] **Step 2: Create `vercel.json` with the daily cron schedule**

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 0 * * *"
    }
  ]
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass (the route itself is a thin wrapper around already-tested `findDueReminders`, `getSlackWebhook`, and `sendSlackMessage`; it's verified manually end-to-end in Task 14 with a real webhook).

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/reminders/route.ts vercel.json
git commit -m "feat: add cron-protected reminder endpoint and Vercel Cron schedule"
```

---

### Task 13: Dashboard page

**Files:**
- Create: `app/dashboard/page.tsx`
- Modify: `app/page.tsx` — redirect to `/dashboard`

**Interfaces:**
- Consumes: `listApplications` (Task 5) joined client-side with each application's stages via `listStages` (Task 7).

- [ ] **Step 1: Update `app/page.tsx` to redirect**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

- [ ] **Step 2: Create the dashboard page**

```tsx
// app/dashboard/page.tsx
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listApplications } from '@/lib/db/applications';
import { listStages } from '@/lib/db/stages';

interface UpcomingItem {
  applicationId: string;
  company: string;
  position: string;
  stageType: string;
  scheduledAt: string;
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const applications = await listApplications(supabase);

  const upcoming: UpcomingItem[] = [];
  for (const app of applications) {
    const stages = await listStages(supabase, app.id);
    for (const stage of stages) {
      if (stage.status === '예정') {
        upcoming.push({
          applicationId: app.id,
          company: app.company,
          position: app.position,
          stageType: stage.stage_type,
          scheduledAt: stage.scheduled_at,
        });
      }
    }
  }
  upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <main>
      <h1>대시보드</h1>
      <nav>
        <Link href="/applications">지원 공고</Link> | <Link href="/settings">설정</Link>
      </nav>
      <h2>다가오는 일정</h2>
      <ul>
        {upcoming.map((item, i) => {
          const days = Math.ceil((new Date(item.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <li key={i}>
              <Link href={`/applications/${item.applicationId}`}>
                D{days >= 0 ? `-${days}` : `+${-days}`} — {item.company} {item.stageType} ({new Date(item.scheduledAt).toLocaleString('ko-KR')})
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/dashboard/page.tsx
git commit -m "feat: add dashboard with upcoming schedule"
```

---

### Task 14: Deployment setup and manual verification

**Files:**
- Create: `README.md`

**Interfaces:**
- None — this task wires the deployed app to a real Supabase project and verifies the full flow in a browser.

- [ ] **Step 1: Write `README.md` with setup instructions**

```markdown
# Job Application Tracker

## Local setup

1. Create a Supabase project at https://supabase.com.
2. In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`.
3. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, service_role key (keep secret).
   - `ALLOWED_SIGNUP_EMAIL` — the only email allowed to create an account.
   - `CRON_SECRET` — any random string; must match the value set in Vercel.
4. `npm install && npm run dev`, then visit `/signup` to create your account, then `/login`.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same environment variables from `.env.local` in the Vercel project settings.
3. Vercel reads `vercel.json` automatically and schedules `/api/cron/reminders` to run daily at 00:00 UTC. Adjust the cron schedule there if you want a different time.
4. In Settings → Slack, paste a Slack Incoming Webhook URL (create one at https://api.slack.com/messaging/webhooks) so reminders have somewhere to go.

## Sharing this app with someone else

They should fork/clone the repo and deploy their own copy with their own Supabase project, their own `ALLOWED_SIGNUP_EMAIL`, and their own Vercel project. This app is single-tenant: one deployment = one user.
```

- [ ] **Step 2: Create a Supabase project and run the migration**

Follow README.md Step 1-2 using the Supabase dashboard (web UI, no CLI required for this first setup).

- [ ] **Step 3: Run the app locally and verify the full flow**

Run: `npm run dev`

Manually verify in a browser:
1. Visit `/signup`, create the account with the `ALLOWED_SIGNUP_EMAIL` — succeeds.
2. Visit `/signup` again with a different email — rejected with 403.
3. Visit `/login`, sign in — redirected to `/dashboard`.
4. Visit `/applications/new`, create an application — appears in `/applications`.
5. Open the application detail page, add a stage with `scheduled_at` set to tomorrow and `slack_reminder_days_before` = 1 — appears in the timeline and on `/dashboard` under "다가오는 일정".
6. Visit `/settings`, paste a real Slack Incoming Webhook URL, save.
7. Manually call the cron endpoint: `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/reminders` — confirm a message arrives in the Slack channel.
8. Log out (clear cookies) and confirm visiting `/dashboard` redirects to `/login`.

- [ ] **Step 4: Deploy to Vercel and re-verify steps 3.3–3.7 against the live URL**

Follow README.md's deployment section, then repeat the manual checks above against the deployed URL to confirm Vercel Cron and the production Supabase project work end-to-end.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add setup and deployment instructions"
```
