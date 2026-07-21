-- 알림 옵션 확장: '매일' 발송 + 발송 시각(HH:MM)
-- notify_remind(리마인드) 컬럼은 미사용으로 남겨두고 항상 0으로 기록
ALTER TABLE tasks ADD COLUMN notify_daily INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN notify_time TEXT NOT NULL DEFAULT '10:00';
