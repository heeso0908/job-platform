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
3. Vercel reads `vercel.json` automatically and schedules `/api/cron/reminders` to run daily at 00:00 UTC as a fallback. On the free Hobby plan, Vercel Cron can't run more often than once a day, so reminders would all arrive around the same time each day regardless of each stage's actual time. To have reminders arrive close to each stage's own scheduled time (e.g. exactly 1 day before, same hour), set up a free external scheduler to call the endpoint every 15–30 minutes instead:
   - Create a free account at https://cron-job.org (or a similar service).
   - Add a job that sends a `GET` request to `https://<your-app>.vercel.app/api/cron/reminders` every 15–30 minutes.
   - Add an `Authorization` header: `Bearer <CRON_SECRET>` (the same value as your `CRON_SECRET` env var).
   - The endpoint is idempotent — calling it more often than needed is harmless; a reminder is only ever sent once per stage (tracked in `last_reminder_sent_at`).
4. In Settings → Slack, paste a Slack Incoming Webhook URL (create one at https://api.slack.com/messaging/webhooks) so reminders have somewhere to go.

## Sharing this app with someone else

They should fork/clone the repo and deploy their own copy with their own Supabase project, their own `ALLOWED_SIGNUP_EMAIL`, and their own Vercel project. This app is single-tenant: one deployment = one user.

## Database migrations

Supabase SQL Editor에서 `supabase/migrations` 안의 파일을 번호 순서대로 실행하세요. 파일은 여러 번 실행해도 안전합니다.

- `0001_init.sql` — 공고, 전형 일정, Slack 웹훅 테이블
- `0002_essay_questions.sql` — 자소서 문항/답변/태그 테이블과 검색 인덱스 (자소서 기능에 필요)
- `0003_experiences.sql` — 경험 정리 라이브러리 테이블 (경험 기능에 필요)
- `0004_experience_category_fields.sql` — 경험 카테고리별 전용 필드 저장용 컬럼 추가
- `0005_stage_end_time.sql` — 전형 일정의 선택적 종료 일시 컬럼 추가 (인적성처럼 시간 범위가 있는 경우)
- `0006_reminder_sent_tracking.sql` — 알림 중복 발송 방지를 위한 마지막 발송 시각 컬럼 추가 (자주 도는 외부 크론 대응에 필요)
