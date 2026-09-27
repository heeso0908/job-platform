-- 경험 정리 라이브러리. 지원서 양식에 복사해 붙일 항목들을 카테고리 상관없이
-- 하나의 공통 양식으로 저장한다. 여러 번 실행해도 안전하도록 작성했다.

create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default '기타',
  title text not null,
  organization text,
  period_start date,
  period_end date,
  summary text,
  detail text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experiences_user_idx on experiences (user_id, created_at desc);
create index if not exists experiences_title_trgm on experiences using gin (title gin_trgm_ops);
create index if not exists experiences_detail_trgm on experiences using gin (detail gin_trgm_ops);
create index if not exists experiences_tags_idx on experiences using gin (tags);

drop trigger if exists experiences_set_updated_at on experiences;
create trigger experiences_set_updated_at
  before update on experiences
  for each row execute function set_updated_at();

alter table experiences enable row level security;

drop policy if exists "experiences_owner_all" on experiences;
create policy "experiences_owner_all" on experiences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
