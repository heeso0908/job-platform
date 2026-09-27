-- 경험 카테고리별 전용 필드(예: 경력의 고용형태/부서/직급, 학력의 학점/전공 등)를
-- 저장할 자리. 카테고리마다 필드가 달라서 유연한 jsonb로 둔다.

alter table experiences add column if not exists fields jsonb not null default '{}'::jsonb;
