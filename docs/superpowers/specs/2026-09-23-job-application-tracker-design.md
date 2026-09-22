# 취업 준비 플랫폼 — 서브프로젝트 A: 공고 + 일정 관리 설계

날짜: 2026-09-23

## 배경 및 목표

취업 준비를 위한 플랫폼을 4개의 독립적인 서브프로젝트로 나눠서 만든다:

- **A. 공고 + 일정 관리** (이 문서의 대상) — 지원 공고 등록, 서류/인적성/면접 등 전형 단계별 일정 관리, Slack 리마인더
- **B. 자기소개서 DB** — 공고별 자소서 항목/제출 내용 기록 및 키워드 검색 (A의 공고 데이터에 의존)
- **C. 경험 정리 라이브러리** — 공고 작성 시 복붙하기 쉬운 경험 정리 (A/B에 의존)
- **D. 추천 공고 리스트** — 자체 구현 또는 외부 사이트(사람인/원티드 등) 스크래핑 (마지막 순서, 법적/기술적 리스크 검토 필요)

B, C, D는 A의 데이터 모델을 기반으로 확장되므로 A를 가장 먼저 만든다. 이 문서는 **A만** 다룬다.

## 배포/사용 형태

- 본인 1명이 사용하는 것을 기본으로 하되, **코드를 템플릿으로 공유**해서 다른 사람도 자기 Supabase + Vercel 계정에 개별로 배포해 쓸 수 있는 구조로 만든다.
- 즉 하나의 배포 = 한 사람 전용. 여러 사람이 하나의 DB를 공유하는 멀티테넌시 구조는 아니다.
- Slack 리마인더가 PC 전원 상태와 무관하게 동작해야 하므로, 로컬 실행이 아닌 **클라우드 배포**를 전제로 한다.

## 아키텍처

- **프레임워크**: Next.js (App Router, TypeScript) — 프론트엔드 + API Route를 한 프로젝트에서 처리
- **DB/인증**: Supabase (Postgres + Supabase Auth 이메일/비밀번호 로그인)
- **배포**: Vercel (무료 티어)
- **알림**: Slack Incoming Webhook + Vercel Cron(매일 1회 트리거)이 마감 임박 일정을 확인해 Slack으로 전송

### 보안/접근 제어

- Supabase 프로젝트는 배포자 본인 전용이며, 다른 Supabase 고객의 프로젝트와는 물리적으로 완전히 분리된 별도 DB다.
- 회원가입(signup)은 **환경변수에 등록된 허용 이메일 1개**로 제한한다. 그 외 이메일로 가입 시도 시 거부한다.
- 코드를 공유받은 사람은 자기 Supabase/Vercel 프로젝트에 배포하면서 자기 이메일을 허용 이메일로 설정하고 첫 계정을 만든다.
- Row Level Security(RLS)는 방어 심화 차원에서 여전히 적용한다(허용 이메일 제한이 뚫리는 경우에 대비).

## 데이터 모델

### `applications` (지원 공고)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| company | text | 회사명 |
| position | text | 직무 |
| apply_link | text (nullable) | 공고 링크 |
| memo | text (nullable) | 자유 메모 |
| status | text | 지원예정 / 진행중 / 최종합격 / 불합격 |
| created_at | timestamptz | 생성일 |

### `application_stages` (전형 단계)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| application_id | uuid | FK → applications |
| stage_type | text | 서류 / 인적성 / 면접 등 자유 텍스트 (순서 제한 없이 여러 개 추가 가능) |
| scheduled_at | timestamptz | 일정 일시 |
| status | text | 예정 / 완료 / 통과 / 탈락 |
| notes | text (nullable) | 메모 |
| slack_reminder_days_before | int | 며칠 전에 알림 받을지 (기본값 1) |

### `slack_webhooks`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | uuid | FK → auth.users (PK) |
| webhook_url | text | 등록한 Slack Incoming Webhook URL |

하나의 공고(application)는 여러 전형 단계(stage)를 가질 수 있으며, 단계는 순서 제약 없이 자유롭게 추가/삭제 가능하다 (예: 서류 → 1차면접 → 2차면접 → 최종면접).

## 주요 화면/플로우

- **로그인/회원가입**: Supabase Auth 이메일+비밀번호 (가입은 허용 이메일만 가능)
- **대시보드**: 다가오는 일정(마감/시험/면접)을 날짜순으로 카드 형태로 표시, D-day 표시
- **공고 목록**: 전체 지원 공고를 상태별(지원예정/진행중/합격/불합격)로 필터링해서 보는 리스트/보드 뷰
- **공고 상세**: 공고 정보 + 전형 단계 타임라인(추가/수정/삭제) + 메모
- **설정**: Slack 웹훅 URL 등록/수정, 허용 이메일 확인

## Slack 알림 동작

1. Vercel Cron이 매일 정해진 시각(예: 오전 9시 KST)에 API route(`/api/cron/reminders`)를 호출
2. 오늘 기준으로 `scheduled_at - slack_reminder_days_before` = 오늘인 `application_stages` 조회
3. 각 결과에 대해 사용자의 `slack_webhooks.webhook_url`로 메시지 전송 (예: "OO기업 서류 마감이 내일입니다")
4. Cron endpoint는 Vercel Cron만 호출할 수 있도록 시크릿 헤더로 보호한다

## 테스트 범위

- 공고/단계 CRUD API route에 대한 유닛 테스트
- 크론 알림 로직(날짜 계산: `scheduled_at - days_before = today` 판정)에 집중한 유닛 테스트
- RLS 정책이 실제로 다른 user_id의 행을 막는지 확인하는 통합 테스트(선택)

## 이 문서에서 다루지 않는 것 (다음 서브프로젝트)

- 자기소개서 항목/제출 기록, 키워드 검색 (서브프로젝트 B)
- 경험 라이브러리 (서브프로젝트 C)
- 추천 공고 / 외부 사이트 스크래핑 (서브프로젝트 D)
