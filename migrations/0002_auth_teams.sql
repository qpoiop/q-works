-- 회원가입/팀/권한/FCM — v2 스키마
CREATE TABLE IF NOT EXISTS teams (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT OR IGNORE INTO teams (code, name) VALUES
  ('PROD2026', '프로덕트팀'),
  ('DESIGN01', '디자인팀'),
  ('GROWTH22', '그로스팀');

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  team_code TEXT REFERENCES teams(code),
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- FCM 푸시 토큰
CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  user_nickname TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_tokens(user_nickname);

ALTER TABLE tasks ADD COLUMN team_code TEXT;
ALTER TABLE tasks ADD COLUMN allow_edit INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tasks ADD COLUMN prev_status TEXT;
ALTER TABLE notifications ADD COLUMN user_nickname TEXT;

-- 시드 데이터 v2 정합화 (시안: '김하늘 (나)' → '김하늘', 팀 스코프, 편집 제한 샘플 t4·t10)
UPDATE tasks SET assignee = '김하늘' WHERE assignee = '김하늘 (나)';
UPDATE tasks SET team_code = 'PROD2026' WHERE team_code IS NULL;
UPDATE tasks SET allow_edit = 0 WHERE id IN ('t4', 't10');
UPDATE notifications SET user_nickname = '김하늘' WHERE user_nickname IS NULL;
