-- 팀 작업 관리 — 초기 스키마 + 시드
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  short TEXT NOT NULL,
  color TEXT NOT NULL,
  team TEXT NOT NULL DEFAULT '',
  is_me INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  assignee TEXT NOT NULL,
  due TEXT NOT NULL,                -- YYYY-MM-DD
  priority TEXT NOT NULL DEFAULT '보통' CHECK (priority IN ('높음','보통','낮음')),
  status TEXT NOT NULL DEFAULT '예정' CHECK (status IN ('예정','진행중','완료')),
  tags TEXT NOT NULL DEFAULT '[]',  -- JSON array
  is_public INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  notify_update INTEGER NOT NULL DEFAULT 1,
  notify_remind INTEGER NOT NULL DEFAULT 1,
  notify_deadline INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  due TEXT NOT NULL,
  color TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS milestone_tasks (
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sort INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (milestone_id, task_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('임박','업데이트','리마인드')),
  task_id TEXT,
  task_title TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  read INTEGER NOT NULL DEFAULT 0
);

-- 멤버 시드 (시안 그대로)
INSERT OR IGNORE INTO members (name, short, color, team, is_me) VALUES
  ('김하늘 (나)', '나',   'oklch(0.54 0.16 264)', '프로덕트팀', 1),
  ('김서연',     '서연', 'oklch(0.66 0.15 350)', '프로덕트팀', 0),
  ('박준호',     '준호', 'oklch(0.6 0.1 190)',  '프로덕트팀', 0),
  ('이지훈',     '지훈', 'oklch(0.66 0.15 45)',  '프로덕트팀', 0),
  ('최유나',     '유나', 'oklch(0.6 0.15 300)',  '프로덕트팀', 0),
  ('정민석',     '민석', 'oklch(0.58 0.12 150)', '프로덕트팀', 0),
  ('한소희',     '소희', 'oklch(0.63 0.16 15)',  '프로덕트팀', 0),
  ('강태오',     '태오', 'oklch(0.6 0.13 240)',  '프로덕트팀', 0);

-- 업무 시드 (시안 내용, 마감일은 시안의 '오늘' 기준 오프셋을 현재 날짜에 적용)
INSERT OR IGNORE INTO tasks (id, title, content, assignee, due, priority, status, tags, is_public, notify_update, notify_remind, notify_deadline) VALUES
  ('t1',  '3분기 마케팅 캠페인 기획안', '채널별 예산 배분과 핵심 메시지 확정', '김하늘 (나)', date('now'), '높음', '진행중', '["마케팅","3분기"]', 1, 1, 1, 1),
  ('t2',  '신규 온보딩 플로우 리뷰', '가입 후 첫 3단계 이탈률 개선안 검토', '김하늘 (나)', date('now'), '보통', '예정', '["제품"]', 0, 0, 1, 1),
  ('t3',  '주간 팀 회의 자료 준비', '지난주 지표 요약 + 이번주 우선순위', '김하늘 (나)', date('now'), '보통', '완료', '["회의"]', 0, 0, 0, 0),
  ('t4',  'API 응답 속도 최적화', '상세 조회 엔드포인트 캐싱 적용', '이지훈', date('now','-1 day'), '높음', '진행중', '["개발"]', 1, 1, 1, 1),
  ('t5',  '월간 정산 보고서 제출', '6월 매출·비용 정산 및 재무팀 공유', '김하늘 (나)', date('now','+1 day'), '높음', '예정', '["재무"]', 1, 1, 1, 1),
  ('t6',  '디자인 시스템 컴포넌트 정리', '버튼·인풋 토큰 통합 및 문서화', '최유나', date('now','+1 day'), '보통', '진행중', '["디자인"]', 1, 1, 0, 1),
  ('t7',  '고객 인터뷰 5건 진행', '파워유저 대상 심층 인터뷰 스크립트', '김하늘 (나)', date('now','+2 day'), '보통', '예정', '["리서치"]', 0, 0, 1, 1),
  ('t8',  '앱 스토어 심사 대응', '거절 사유 수정 후 재제출', '김하늘 (나)', date('now','+3 day'), '높음', '진행중', '["제품","출시"]', 1, 1, 1, 1),
  ('t9',  '채용 공고 게시', '프론트엔드 시니어 포지션 오픈', '한소희', date('now','+4 day'), '낮음', '예정', '["인사"]', 1, 0, 0, 0),
  ('t10', '보안 점검 정기 감사', '접근 권한 및 로그 검토', '정민석', date('now','+6 day'), '높음', '예정', '["보안"]', 1, 1, 0, 1),
  ('t11', '브랜드 리뉴얼 킥오프', '로고·컬러 방향성 워크숍', '김서연', date('now','+9 day'), '보통', '예정', '["브랜드"]', 1, 0, 0, 0),
  ('t12', '데이터 파이프라인 마이그레이션', '신규 웨어하우스로 ETL 이전', '박준호', date('now','+14 day'), '높음', '예정', '["개발"]', 1, 1, 0, 1),
  ('t13', '연간 로드맵 초안', '하반기 핵심 목표 3가지 정리', '김하늘 (나)', date('now','+20 day'), '낮음', '예정', '["전략"]', 0, 0, 1, 0);

-- 마일스톤 시드
INSERT OR IGNORE INTO milestones (id, title, due, color, sort) VALUES
  ('m1', '제품 v2.0 출시',    date('now','+15 day'), 'oklch(0.54 0.16 264)', 0),
  ('m2', '3분기 마케팅 런칭', date('now','+30 day'), 'oklch(0.66 0.15 350)', 1),
  ('m3', '하반기 채용·인프라', date('now','+47 day'), 'oklch(0.6 0.13 240)', 2);

INSERT OR IGNORE INTO milestone_tasks (milestone_id, task_id, sort) VALUES
  ('m1','t2',0),('m1','t8',1),('m1','t6',2),('m1','t4',3),
  ('m2','t1',0),('m2','t11',1),
  ('m3','t9',0),('m3','t12',1),('m3','t10',2);

-- 알림 시드
INSERT OR IGNORE INTO notifications (id, type, task_id, task_title, detail, created_at, read) VALUES
  ('n1', '임박', 't5', '월간 정산 보고서 제출',
    '내일(' || CAST(strftime('%m', date('now','+1 day')) AS INTEGER) || '/' || CAST(strftime('%d', date('now','+1 day')) AS INTEGER) || ') 마감 예정이에요.',
    strftime('%Y-%m-%dT%H:%M:%fZ','now'), 0),
  ('n2', '임박', 't4', 'API 응답 속도 최적화', '마감이 하루 지났어요.', strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 hour'), 0),
  ('n3', '업데이트', 't6', '디자인 시스템 컴포넌트 정리', '최유나님이 진행중으로 변경했어요.', strftime('%Y-%m-%dT%H:%M:%fZ','now','-3 hour'), 0),
  ('n4', '리마인드', 't7', '고객 인터뷰 5건 진행',
    '모레(' || CAST(strftime('%m', date('now','+2 day')) AS INTEGER) || '/' || CAST(strftime('%d', date('now','+2 day')) AS INTEGER) || ') 예정된 작업이에요.',
    strftime('%Y-%m-%dT%H:%M:%fZ','now','-6 hour'), 1),
  ('n5', '업데이트', 't8', '앱 스토어 심사 대응', '상태가 진행중으로 변경됐어요.', strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day'), 1);
