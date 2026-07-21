-- 발송 시각을 허용 슬롯(10:00·16:00)으로 정규화
-- 0004에서 기존 행 기본값이 '09:00'로 들어가 cron 슬롯과 불일치하는 문제 보정
UPDATE tasks SET notify_time = '10:00' WHERE notify_time NOT IN ('10:00', '16:00');
