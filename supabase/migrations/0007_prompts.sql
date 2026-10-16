-- 자소서를 AI로 쓸 때 쓰는 프롬프트를 카테고리별로 저장한다.
-- 여러 번 실행해도 안전하도록 작성했다. set_updated_at()은 0002에서 만든 함수를 재사용한다.

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default '기타',
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prompts_user_idx on prompts (user_id, category, created_at desc);

drop trigger if exists prompts_set_updated_at on prompts;
create trigger prompts_set_updated_at
  before update on prompts
  for each row execute function set_updated_at();

alter table prompts enable row level security;

drop policy if exists "prompts_owner_all" on prompts;
create policy "prompts_owner_all" on prompts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
