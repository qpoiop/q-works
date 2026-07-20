# Q-WORKS · 팀 작업 관리

Claude Design 시안(`팀 작업 관리.dc.html` v2)을 1:1로 구현한 팀 업무 관리 웹앱.

- **프런트엔드**: React 18 + Vite + TypeScript, PWA(vite-plugin-pwa, 오프라인 셸 캐시·홈 화면 설치)
- **백엔드**: Cloudflare Worker (정적 자산 + `/api/*` JSON API) + D1
- **배포 URL**: https://team-task-app.qpoiop3.workers.dev (체험 계정: `김하늘` / `1234`)

## 기능

- 회원가입/로그인 (닉네임+비밀번호, 세션 쿠키 HttpOnly·Secure·SameSite=Lax, 30일)
- 팀 코드 참여/나가기 (`PROD2026`·`DESIGN01`·`GROWTH22`), 팀 스코프 공개 업무·타임라인·마일스톤·캘린더
- 업무 CRUD, 완료 토글(이전 상태 복귀 + 되돌리기 토스트), 편집 권한(`allowEdit`: 팀원 허용/나만 편집 → 읽기전용 모달·잠김 배지, 서버 강제)
- 프로필: 아바타 업로드(4MB 원본 → 256px JPEG 리사이즈), 닉네임 중복확인, 비밀번호 변경
- 알림 패널·브라우저 알림·FCM 서버 로직(시크릿 설정 시 활성)

## 구조

```
src/
  config/meta.ts      # 디자인 토큰·상태/우선순위/알림/멤버 메타 (데이터 기반 렌더링 단일 소스)
  lib/                # api·date·notify·avatar(리사이즈)·push(FCM 스텁)·usePwaInstall
  store/AppStore.tsx  # 인증 상태 + 낙관적 CRUD + 토스트(undo)
  components/         # AuthPage, TaskCard, TaskModal, SettingsModal, ProfileMenu, TeamJoinCard, Confirm, Toasts, 빈/에러/스켈레톤 ...
  views/              # 오늘·내 할 일·타임라인·마일스톤·캘린더·팀
worker/
  index.ts            # API 라우터 + 마이그레이션 러너(워커가 D1에 직접 적용) + 접근제어
  auth.ts / fcm.ts / security.ts
migrations/           # 0001 스키마+시드, 0002 auth/team/push
.github/workflows/deploy.yml  # production 푸시 → 빌드+wrangler deploy (secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
```

## 과금 방어·보안

- 레이트리밋: IP당 쓰기 30/분·읽기 120/분 (Workers Rate Limiting 바인딩 + 아이솔레이트 인메모리 이중)
- 요청 본문 16KB 제한, 필드 길이 제한(제목 200·내용 4000·태그 10×30…), 업무 2,000건 상한, 알림 사용자당 200건 유지
- 변형 요청 Origin/Sec-Fetch-Site 검증(403), JSON content-type 강제(415), 메서드 허용목록(405)
- 모든 응답 보안 헤더(CSP·X-Frame-Options DENY·nosniff·Referrer-Policy 등) — 정적 자산은 `public/_headers`, API는 워커
- 서버측 권한 강제: 미로그인 401, 남의 비공개/타팀 업무 404, `allowEdit=false` 업무 수정/삭제 403
- `robots.txt` 전체 차단

## FCM 연동 (준비 완료, 활성화 대기)

서버(`worker/fcm.ts`)와 D1(`push_tokens`)은 구현 완료. 활성화 절차:
1. Firebase 프로젝트 생성 → 서비스 계정 JSON 발급
2. `npx wrangler secret put FCM_SERVICE_ACCOUNT` (JSON 전체 붙여넣기)
3. 클라이언트: `npm i firebase` 후 `src/lib/push.ts`에 config·getToken 연결 (`api.registerPush(token)` 호출부 준비됨)
알림 생성 시(`POST /api/notifications`) 해당 사용자의 등록 기기 전체로 발송하고, 만료 토큰은 자동 정리한다.

## 개발

```bash
npm install && npm run build
npx wrangler dev -c wrangler.local.jsonc     # http://localhost:8787 (로컬 D1, 스키마는 워커가 자동 적용)
npm run dev                                  # HMR (API는 8787 프록시)
```

## 배포

- 자동: `production` 브랜치 푸시 → GitHub Actions가 빌드+배포 (레포 secrets에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 필요)
- 수동: `CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npm run deploy`

D1 마이그레이션은 워커가 첫 요청에서 `_migrations` 테이블 기준으로 자동 적용한다 (토큰에 D1 API 권한 불필요).
