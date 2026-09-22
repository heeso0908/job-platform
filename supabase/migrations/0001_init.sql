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
