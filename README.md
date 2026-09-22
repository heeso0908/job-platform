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
