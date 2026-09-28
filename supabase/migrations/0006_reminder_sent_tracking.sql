-- 알림을 정확한 순간(마감 N일 전, 같은 시각) 기준으로 판단하고, 한 번 보낸 뒤에는
-- 다시 보내지 않도록 마지막 발송 시각을 기록한다. 크론이 하루에 여러 번 돌아도
-- 중복 발송을 막기 위해 필요하다.

alter table application_stages add column if not exists last_reminder_sent_at timestamptz;
