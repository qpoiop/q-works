-- 상세 내용 렌더 방식: 'plain' | 'markdown' (기본 plain)
ALTER TABLE tasks ADD COLUMN content_format TEXT NOT NULL DEFAULT 'plain';
