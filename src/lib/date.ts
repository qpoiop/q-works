import { weekdayName } from '../config/meta'

/** 자정 기준 오늘 (로컬) */
export function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** due(YYYY-MM-DD)와 오늘의 일수 차이. 음수 = 지남 */
export function diffDays(due: string, base: Date = today()): number {
  return Math.round((new Date(due + 'T00:00:00').getTime() - base.getTime()) / 86400000)
}

export function fmtDate(due: string): string {
  const d = new Date(due + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function weekdayOf(due: string): string {
  return weekdayName(new Date(due + 'T00:00:00').getDay())
}

/** 알림 시각 상대 표기 */
export function relTime(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 2) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const d = new Date(iso)
  const days = Math.round((today().getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000)
  if (days === 1) return '어제'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 마감 배지 메타 (시안 decorate 로직 그대로) */
export function dueMeta(due: string, done: boolean): { label: string; bg: string; color: string } {
  const diff = diffDays(due)
  if (done) return { label: fmtDate(due), bg: '#f2f3f5', color: '#8a94a6' }
  if (diff < 0)
    return { label: diff === -1 ? '어제 마감' : `${-diff}일 지남`, bg: 'oklch(0.95 0.04 25)', color: 'oklch(0.5 0.19 25)' }
  if (diff === 0) return { label: '오늘 마감', bg: 'oklch(0.95 0.05 264)', color: 'oklch(0.46 0.17 264)' }
  if (diff === 1) return { label: '내일 마감', bg: 'oklch(0.96 0.06 75)', color: 'oklch(0.5 0.14 65)' }
  if (diff <= 6) return { label: `${diff}일 뒤`, bg: '#eef0f3', color: '#5b6472' }
  return { label: fmtDate(due), bg: '#eef0f3', color: '#5b6472' }
}
