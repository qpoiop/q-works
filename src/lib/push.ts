// 표준 Web Push(VAPID) 클라이언트 — 서버에서 공개키 받아 구독, 서버에 등록.
// 앱이 닫혀 있어도 서비스워커(src/sw.ts)가 push 이벤트로 시스템 알림 표시.

function b64uToUint8(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64u.length % 4)) % 4)
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** 알림 권한 있을 때 호출 — SW 준비 후 구독하고 서버 등록. 성공 시 true. */
export async function subscribePush(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.ready
    // 서버 VAPID 공개키
    const res = await fetch('/api/push/vapid-public', { credentials: 'same-origin' })
    const { key } = (await res.json()) as { key: string | null }
    if (!key) return false // 서버에 VAPID 미설정

    let sub = await reg.pushManager.getSubscription()
    const appKey = b64uToUint8(key)
    // 기존 구독의 키가 다르면 재구독
    if (sub && !applicationServerKeyMatches(sub, appKey)) {
      await sub.unsubscribe().catch(() => {})
      sub = null
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey })
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys })
    })
    return true
  } catch (e) {
    console.warn('push subscribe failed:', e)
    return false
  }
}

function applicationServerKeyMatches(sub: PushSubscription, key: Uint8Array): boolean {
  const existing = sub.options?.applicationServerKey
  if (!existing) return false
  const a = new Uint8Array(existing as ArrayBuffer)
  if (a.length !== key.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== key[i]) return false
  return true
}

/** 구독 해제 + 서버에서 제거 */
export async function unsubscribePush(): Promise<void> {
  if (!pushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    const endpoint = sub.endpoint
    await sub.unsubscribe().catch(() => {})
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ endpoint })
    })
  } catch {
    /* 무시 */
  }
}
