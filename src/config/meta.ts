import type { NotifType, Priority, Status, ViewKey } from '../types'

/** 디자인 토큰 — 시안의 oklch 값 그대로 */
export const COLOR = {
  primary: 'oklch(0.54 0.16 264)',
  primaryHover: 'oklch(0.48 0.16 264)',
  primaryTextDark: 'oklch(0.44 0.17 264)',
  primaryText: 'oklch(0.46 0.17 264)',
  primarySoft: 'oklch(0.95 0.05 264)',
  primarySofter: 'oklch(0.96 0.03 264)',
  danger: 'oklch(0.6 0.19 25)',
  dangerText: 'oklch(0.5 0.19 25)',
  dangerSoft: 'oklch(0.95 0.04 25)',
  warnText: 'oklch(0.5 0.14 65)',
  warnSoft: 'oklch(0.96 0.06 75)',
  successText: 'oklch(0.5 0.12 150)',
  successSoft: 'oklch(0.95 0.05 150)',
  ink: '#1a1d21',
  sub: '#8a94a6',
  subDark: '#5b6472',
  border: '#e0e3e8',
  cardBorder: '#eceef1',
  bg: '#eef0f3'
} as const

export const PRIORITIES: Priority[] = ['높음', '보통', '낮음']
export const STATUSES: Status[] = ['예정', '진행중', '완료']

export const PRIORITY_META: Record<Priority, { dot: string; seg: string }> = {
  높음: { dot: 'oklch(0.62 0.19 25)', seg: 'oklch(0.62 0.19 25)' },
  보통: { dot: 'oklch(0.72 0.15 65)', seg: 'oklch(0.68 0.15 65)' },
  낮음: { dot: 'oklch(0.68 0.03 260)', seg: 'oklch(0.55 0.04 260)' }
}

export const STATUS_META: Record<Status, { bg: string; color: string; seg?: string }> = {
  예정: { bg: '#eef0f3', color: '#5b6472' },
  진행중: { bg: 'oklch(0.95 0.04 264)', color: 'oklch(0.46 0.16 264)' },
  완료: { bg: 'oklch(0.95 0.05 150)', color: 'oklch(0.48 0.12 150)', seg: 'oklch(0.55 0.13 150)' }
}

export const NOTIF_TYPE_META: Record<NotifType, { label: string; color: string; bg: string }> = {
  임박: { label: '기간 임박', color: 'oklch(0.55 0.19 25)', bg: 'oklch(0.95 0.04 25)' },
  업데이트: { label: '작업 업데이트', color: 'oklch(0.46 0.17 264)', bg: 'oklch(0.95 0.05 264)' },
  리마인드: { label: '리마인드', color: 'oklch(0.5 0.14 65)', bg: 'oklch(0.96 0.06 75)' }
}

export const TOAST_COLOR = {
  info: 'oklch(0.6 0.15 264)',
  status: 'oklch(0.6 0.13 264)',
  edit: 'oklch(0.55 0.13 264)',
  create: 'oklch(0.55 0.12 150)',
  danger: 'oklch(0.6 0.19 25)'
} as const

export interface NavItem {
  key: ViewKey
  label: string
  title: string
  subtitle: string | ((today: Date) => string)
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
export const weekdayName = (d: number) => WEEKDAYS[d]

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'today',
    label: '오늘',
    title: '오늘',
    subtitle: (t) => `${t.getMonth() + 1}월 ${t.getDate()}일 ${WEEKDAYS[t.getDay()]}요일 · 마감 임박 업무를 먼저 확인하세요`
  },
  { key: 'mytasks', label: '내 할 일', title: '내 할 일', subtitle: '내가 담당한 모든 업무' },
  { key: 'timeline', label: '타임라인', title: '타임라인', subtitle: '마감일 순서로 보는 내 업무와 공개 업무' },
  { key: 'milestone', label: '마일스톤', title: '마일스톤', subtitle: '주요 목표별 진행 상황' },
  { key: 'calendar', label: '캘린더', title: '캘린더', subtitle: '월간 일정 한눈에 보기' },
  { key: 'team', label: '팀', title: '팀 대시보드', subtitle: '팀이 공개한 업무 실시간 현황' }
]

export const MY_FILTERS = ['전체', '예정', '진행중', '완료'] as const
export type MyFilter = (typeof MY_FILTERS)[number]

export const WEEKDAY_HEADS = WEEKDAYS.map((w, i) => ({
  label: w,
  color: i === 0 ? 'oklch(0.6 0.15 15)' : i === 6 ? 'oklch(0.55 0.13 264)' : '#8a94a6'
}))

/** 시안 시드 멤버 색·약칭 (그 외 이름은 hashColor·slice 폴백) */
export const MEMBER_META: Record<string, { short: string; color: string }> = {
  김하늘: { short: '하늘', color: 'oklch(0.54 0.16 264)' },
  김서연: { short: '서연', color: 'oklch(0.66 0.15 350)' },
  박준호: { short: '준호', color: 'oklch(0.6 0.1 190)' },
  이지훈: { short: '지훈', color: 'oklch(0.66 0.15 45)' },
  최유나: { short: '유나', color: 'oklch(0.6 0.15 300)' },
  정민석: { short: '민석', color: 'oklch(0.58 0.12 150)' },
  한소희: { short: '소희', color: 'oklch(0.63 0.16 15)' },
  강태오: { short: '태오', color: 'oklch(0.6 0.13 240)' }
}

export function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `oklch(0.62 0.14 ${h})`
}

export function memberMeta(name: string): { short: string; color: string } {
  return MEMBER_META[name] ?? { short: (name || '').slice(0, 2), color: hashColor(name) }
}

/** 체험용 팀 코드 안내 (시안 문구) */
export const DEMO_TEAM_CODES = 'PROD2026 · DESIGN01 · GROWTH22'
