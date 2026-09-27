-- 자소서 문항/답변 기록. 여러 번 실행해도 안전하도록 작성했습니다.

create extension if not exists pg_trgm with schema extensions;

create table if not exists essay_questions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  position int not null default 0,
  question text not null,
  char_limit int,
  answer text not null default '',
  tags text[] not null default '{}',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists essay_questions_application_idx on essay_questions (application_id, position);
create index if not exists essay_questions_question_trgm on essay_questions using gin (question gin_trgm_ops);
create index if not exists essay_questions_answer_trgm on essay_questions using gin (answer gin_trgm_ops);
create index if not exists essay_questions_tags_idx on essay_questions using gin (tags);

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists essay_questions_set_updated_at on essay_questions;
create trigger essay_questions_set_updated_at
  before update on essay_questions
  for each row execute function set_updated_at();

alter table essay_questions enable row level security;

drop policy if exists "essays_owner_all" on essay_questions;
create policy "essays_owner_all" on essay_questions
  for all using (
    exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid())
  );
