# 디자인 가이드

원본 시안: Claude Design 프로젝트 `f046aba8-a175-4d08-a9ce-cce26deb2d80`.
로컬 사본은 [`design/`](../design/)에 보관한다 (`팀 작업 관리.dc.html`, `TaskCard.dc.html`, `support.js`).
**시안이 단일 진실이다** — UI 수정 시 시안을 먼저 갱신하고, 코드 값은 시안의 값을 그대로 옮긴다.

## 토큰

코드 상 단일 소스: [`src/config/meta.ts`](../src/config/meta.ts)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| primary | `oklch(0.54 0.16 264)` | 주요 버튼·활성 상태·로고 |
| primaryHover | `oklch(0.48 0.16 264)` | 버튼 호버 |
| danger | `oklch(0.6 0.19 25)` | 삭제·마감 초과·배지 |
| success | `oklch(0.58 0.13 150)` | 완료 체크·성공 토스트 |
| ink / sub / subDark | `#1a1d21` / `#8a94a6` / `#5b6472` | 본문/보조/중간 텍스트 |
| bg / border / cardBorder | `#eef0f3` / `#e0e3e8` / `#eceef1` | 배경·인풋 테두리·카드 테두리 |

폰트: Pretendard Variable (jsdelivr CDN, `index.html`에서 preconnect).
반응형 브레이크포인트: **860px** (미만 = 모바일: 사이드바 숨김, 하단 네비+헤더 아바타).

## 상태별 컬러 매핑

- 우선순위 점: 높음 `oklch(0.62 0.19 25)` · 보통 `oklch(0.72 0.15 65)` · 낮음 `oklch(0.68 0.03 260)`
- 상태 배지: 예정 회색 · 진행중 파랑 소프트 · 완료 초록 소프트 (`STATUS_META`)
- 마감 배지(`dueMeta`): 지남=red soft, 오늘=primary soft, 내일=amber soft, ≤6일=`N일 뒤`, 그 외=`M월 D일`
- 알림 타입: 임박(red)/업데이트(blue)/리마인드(amber) — `NOTIF_TYPE_META`
- 멤버 아바타: 시드 8명은 `MEMBER_META` 고정 색, 그 외 닉네임은 `hashColor(name)` = `oklch(0.62 0.14 <hash 0-359>)`, 약칭은 앞 2글자

## 하단 네비 (푸터, v3 개선)

`src/components/MobileNav.tsx` + `NavIcon.tsx`

- 컨테이너: `rgba(255,255,255,.95)` + `backdrop-filter: blur(12px)`, 상단 보더 `#edeff2`,
  패딩 `8px 10px calc(10px + env(safe-area-inset-bottom))` — iOS 홈 인디케이터 대응
- 내부 폭 `max-width: 620px` 중앙 정렬, 아이템 6개 균등(`flex:1`)
- 아이콘 필: 32px 높이·max-width 64px·radius 12, 활성 시 배경 `oklch(0.95 0.04 264)`
- 아이콘: 24 viewBox / 25px 렌더, stroke 1.9, round cap/join. 활성 `oklch(0.5 0.17 264)` / 비활성 `#98a0ac`
- 배지(오늘 탭, 오늘·지연 마감 수): 필 우상단(top -3, right 8), 16px, `oklch(0.6 0.19 25)` 배경 + 흰 글자 + 1.5px 흰 보더
- 라벨: 11px, 활성 700/`oklch(0.46 0.17 264)` · 비활성 500/`#8a94a6`, letter-spacing -.4px
- 탭 하이라이트 제거: `-webkit-tap-highlight-color: transparent`
- 사이드바(데스크톱) 배지도 동일하게 red solid + 흰 글자로 통일됨

## 컴포넌트 규칙

- TaskCard: `design/TaskCard.dc.html` 1:1. 체크 버튼 상태 — 미완료(기본 회색 보더, 진행중이면 파랑 보더),
  완료(초록 채움+✓, 호버 scale 1.08), 편집 가능 호버(초록 보더/배경), 권한 없음(회색 채움, cursor default, 잠김 배지)
- 모달·컨펌·토스트: radius 18/11, 그림자·애니메이션(omPop/omFade/omToast/omSlideUp)은 `src/app.css`의 keyframes 사용
- 토스트: 완료 처리 시 5초 + `되돌리기` 버튼, 그 외 2.8초
- 빈 상태: dashed 보더 카드(`EmptyState`), 팀 미소속은 `TeamJoinCard`(뷰별 문구 상이 — 시안 문구 그대로)
- 문구는 임의로 만들지 않는다 — 시안에 없는 신규 문구가 필요하면 시안 톤(해요체)을 따른다

## 시안 → 코드 반영 절차

1. `/design-login` 후 DesignSync로 `팀 작업 관리.dc.html` fetch → `design/`에 저장(버전 diff 용)
2. 이전 사본과 diff → 변경 블록 식별
3. `sc-if`/`sc-for`/decorate 로직을 대응 React 컴포넌트·`meta.ts`에 반영 (하드코딩 금지, 메타 테이블 우선)
4. 데스크톱·모바일(860px 미만)·각 상태(빈/에러/읽기전용) 화면 검증
