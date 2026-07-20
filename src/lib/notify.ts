import type { Task } from '../types'
import { diffDays } from './date'

export function notifSupported(): boolean {
  return typeof Notification !== 'undefined'
}

export function notifPermission(): NotificationPermission {
  return notifSupported() ? Notification.permission : 'default'
}

export function fireBrowserNotif(title: string, body: string) {
  if (notifSupported() && Notification.permission === 'granted') {
    try {
      new Notification(`업무 알림 · ${title}`, { body, tag: title })
    } catch {
      /* 일부 플랫폼에서 생성자 미지원 */
    }
  }
}

/** 내 미완료 업무 중 마감 임박(오늘·내일) 건 브라우저 알림 */
export function checkDeadlines(tasks: Task[], myNickname: string | undefined) {
  if (!myNickname) return
  const soon = tasks.filter(
    (t) => t.assignee === myNickname && t.status !== '완료' && t.notify.deadline && diffDays(t.due) >= 0 && diffDays(t.due) <= 1
  )
  if (soon.length) fireBrowserNotif(`${soon.length}건 마감 임박`, soon.map((t) => t.title).join(', '))
}
