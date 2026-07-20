/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[]
}

// 앱 셸 프리캐시 (vite-plugin-pwa injectManifest)
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Web Push 수신 → 시스템 알림 표시 (앱 닫혀 있어도 동작)
self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string } = {}
  try {
    if (event.data) data = event.data.json()
  } catch {
    data = { body: event.data?.text() }
  }
  const title = data.title || '팀 작업 관리'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      data: { url: data.url || '/' },
      tag: title
    })
  )
})

// 알림 클릭 → 앱 포커스/열기
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string })?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})

export {}
