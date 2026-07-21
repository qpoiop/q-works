# 개발 문서

## 아키텍처

```
[React SPA (Vite, PWA)] ──/api/*──> [Cloudflare Worker] ──> [D1 (SQLite)]
        │                                   │
        └── 정적 자산(dist) ← assets 바인딩 ─┘        └─ FCM HTTP v1 (시크릿 설정 시)
```

- 단일 Worker(`team-task-app`)가 정적 자산과 API를 함께 서빙. 정적 GET은 워커 앞단(assets)에서 처리되므로
  자산 보안 헤더는 `public/_headers`로 부여한다 (워커 헤더는 API 응답에만 적용됨).
- SPA 라우팅: `not_found_handling: single-page-application`.

## 디렉터리

| 경로 | 내용 |
| --- | --- |
| `src/config/meta.ts` | 디자인 토큰·상태/우선순위/알림/멤버/네비 메타 — 렌더링 데이터 소스 |
| `src/store/AppStore.tsx` | 인증 상태(`loading/anon/authed`), 낙관적 CRUD+롤백, 토스트(undo) |
| `src/lib/` | `api`(fetch 래퍼) · `date`(dueMeta 등) · `notify`(브라우저 알림) · `avatar`(4MB→256px 리사이즈) · `push`(FCM 스텁) |
| `src/views/` | 6개 뷰. 서버가 이미 팀 스코프로 필터한 tasks를 받아 파생 계산만 수행 |
| `worker/index.ts` | 라우터 + 마이그레이션 러너 + 접근 제어 |
| `worker/auth.ts` | 세션(쿠키 HttpOnly·Secure·SameSite=Lax, 30일), SHA-256+salt 해시 |
| `worker/security.ts` | 레이트리밋·오리진 검증·크기 제한·보안 헤더 |
| `worker/fcm.ts` | FCM HTTP v1 발송 (서비스계정 JWT RS256 서명, 무효 토큰 정리) |
| `migrations/` | 0001 스키마+시드, 0002 auth/teams/push. **워커가 첫 요청에 자동 적용** |
| `design/` | Claude Design 시안 로컬 사본 (진실 소스의 스냅샷) |

## DB 스키마 (D1)

- `tasks(id, title, content, content_format, assignee, due, priority, status, tags(JSON), is_public, team_code, allow_edit, prev_status, notify_update, notify_deadline, notify_daily, notify_time, …)`
  - `content_format`: `'plain'`|`'markdown'` (상세 내용 렌더 방식)
  - `notify_time`: 발송 시각 고정 슬롯 `'10:00'`·`'16:00'`(KST). `notify_remind` 컬럼은 미사용(레거시, 항상 0)
- `users(id, nickname UNIQUE, password_hash, salt, team_code→teams, avatar(dataURL≤96KB))`
- `sessions(token PK, user_id, expires_at)` / `teams(code PK, name)` / `push_tokens(token PK, user_nickname, platform)`
- `notifications(id, type, task_id, task_title, detail, created_at, read, user_nickname)` — 사용자당 최근 200건 유지
- `_migrations(name PK)` — 워커 마이그레이션 러너 기록. 새 마이그레이션 = `migrations/000N_*.sql` 추가 후
  `worker/index.ts`의 `MIGRATIONS` 배열에 등록 (D1 API 권한 없는 토큰으로도 배포만으로 적용됨)

## API

인증: 세션 쿠키(`twm_session`). 미인증 401. 변형 요청은 same-origin + `application/json` 필수.

| 메서드·경로 | 설명 |
| --- | --- |
| POST `/api/auth/signup` `{nickname,password,teamCode?}` | 가입+로그인. 중복 409, 잘못된 팀코드 400 |
| POST `/api/auth/login` / `/api/auth/logout` | 로그인/로그아웃 |
| GET `/api/bootstrap` | `{me, roster, tasks, milestones, notifications}` — 전부 팀/본인 스코프 |
| PATCH `/api/me` `{nickname?,password?,avatar?}` | 닉 변경 시 업무·알림·푸시토큰 이관 |
| GET `/api/me/nickname-check?nick=` | `ok/dup/same/empty` |
| POST `/api/team/join` `{code}` / `/api/team/leave` | 팀 참여/나가기 |
| POST `/api/tasks` · PATCH/PUT·DELETE `/api/tasks/:id` | CRUD. 비가시 404, `allow_edit=false`&타인 403 |
| POST `/api/notifications` · `/api/notifications/read-all` | 알림 생성(FCM 발송 훅)/모두 읽음 |
| POST `/api/push/register` · `/api/push/unregister` | FCM 토큰 등록/해제 |

## 권한 모델

- 가시성: 내 업무 전부 + (팀 소속 시) 같은 팀의 `is_public=1` 업무
- 편집: `assignee == me` 이거나 `allow_edit=1`. 클라(`store.canEdit`)는 UX용, **서버가 최종 강제**
- 완료 토글: `status='완료'` 설정 시 `prevStatus`에 이전 상태 저장, 해제 시 복귀

## 보안·과금 방어

- 레이트리밋: 쓰기 30/분·읽기 120/분 per IP. CF Rate Limiting 바인딩(머신 단위 근사) + 아이솔레이트 인메모리 이중.
  단독 신뢰 금지 — 최종 백스톱은 Workers/D1 플랜 쿼터.
- 요청 본문 16KB, 필드 길이(`FIELD_LIMITS`), 업무 2,000건 상한, 알림 200건 트림, 아바타 96KB(dataURL)
- CSP 등 보안 헤더: API=워커(`withSecurityHeaders`), 자산=`public/_headers`
- 비밀번호: SHA-256+salt (데모 수준 — 운영 전환 시 PBKDF2/argon2 교체 지점: `worker/auth.ts#hashPassword`)

## FCM 활성화

1. Firebase 콘솔 → 프로젝트 → 서비스 계정 키(JSON) 발급
2. `npx wrangler secret put FCM_SERVICE_ACCOUNT` (JSON 전체)
3. 클라: `npm i firebase` → `src/lib/push.ts`에 config/vapidKey 연결 → `firebase-messaging-sw.js` 추가
4. 이후 `/api/notifications` 생성 시 대상 사용자의 모든 기기로 자동 발송 (`ctx.waitUntil`, 404/400 토큰 자동 삭제)

## 상세 내용 에디터 (PLAIN / MARKDOWN)

`TaskModal`에서 상세 내용 포맷을 `일반`/`마크다운` 탭으로 전환. 마크다운은 `미리보기` 토글 제공.

- 렌더: `src/lib/markdown.ts` `renderMarkdown()` = **marked**(GFM) → **DOMPurify** 살균.
  raw HTML 입력 모드는 없지만 소스에 HTML이 섞여도 `script`·`on*`·`javascript:` URI 제거.
  외부 링크는 `afterSanitizeAttributes` 훅으로 `target=_blank rel=noopener noreferrer` 강제.
- 표시: `.md-body` 클래스로 스타일. `dangerouslySetInnerHTML`에는 **항상 살균 출력만** 주입.
- 카드 스니펫: `mdToPlain()`으로 마커 제거한 1줄 평문.
- 보안: 저장은 raw 소스, **살균은 렌더 시점**. CSP(`script-src 'self'`)가 2차 방어.
  검증 완료 — `<img onerror>`·`javascript:` 링크·`<script>` 모두 제거됨(CSP 없는 vite dev에서도 DOMPurify 단독 차단).

## 알림 (Notifications)

업무별 3종 옵션 — `변경 시`(update)·`마감일 도래 시`(deadline)·`매일`(daily). `TaskModal` 고급 설정에서
마스터 토글 + 다중선택 칩으로 설정. deadline·daily는 **발송 시각**(고정 슬롯 오전 10시·오후 4시) 선택.

- **즉시 알림** (변경 시): 상태 변경 시(`toggleDone` 완료 토글 · `saveTask` 모달 저장) 담당자 본인이면
  인앱 알림 기록 + Web Push. `notify.update` 꺼짐/타인 담당/상태 무변화면 미발송.
- **예약 알림** (마감일 도래·매일): `worker/index.ts`의 `scheduled` 핸들러가 Cron으로 실행.
  - Cron: `0 1 * * *`(01:00 UTC=오전 10시 KST) · `0 7 * * *`(07:00 UTC=오후 4시 KST) — `wrangler.jsonc` `triggers.crons`
  - 슬롯별로 `notify_time` 일치 + 미완료 업무 스캔 → 담당자별 집계 → 마감 임박(당일·D-1) + 매일 리마인드
    각각 인앱 기록 + `sendPushToUser`. KST 날짜는 `scheduledTime` 기반 계산(전역 `Date` 함정 회피).
  - 로컬 트리거: `curl "http://localhost:8788/cdn-cgi/handler/scheduled?cron=0+1+*+*+*"`

**슬롯 확장 시** 3곳 동기화: `wrangler.jsonc` crons · `worker` `NOTIFY_SLOTS`(clamp) · `TaskModal` `NOTIFY_SLOTS`(UI).
슬롯을 늘리면 cron 실행 수가 비례 증가하므로 부하 상한 관점에서 최소로 유지.

## 개발·배포

```bash
npm install
npm run build && npx wrangler dev -c wrangler.local.jsonc   # localhost:8787 (로컬 D1)
npm run dev                                                 # HMR (API → 8787 프록시)
npx tsc --noEmit -p tsconfig.json                           # 타입체크
```

- 자동 배포: `production` 브랜치 push → `.github/workflows/deploy.yml` (secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- 수동: `npm run deploy`
- 주의: workers.dev 전파는 엣지별로 수 분 걸릴 수 있음(플랩). **Workers 전역 스코프에서 `Date.now()`는 0** —
  시간 의존 값은 반드시 요청 핸들러 안에서 계산.

## 성능

- vendor 청크 분리(react/react-dom), Pretendard preconnect, `TaskCard` memo
- PWA: 앱 셸 프리캐시 + jsdelivr 폰트 CacheFirst 1년, `/api/*`는 네비게이션 폴백 제외(no-store)
