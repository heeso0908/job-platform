-- 인적성처럼 시작~종료 시간이 있는 전형을 위한 선택적 종료 일시.

alter table application_stages add column if not exists scheduled_end_at timestamptz;
