// FCM 클라이언트 연동 스텁.
// 서버(worker/fcm.ts)와 D1(push_tokens)은 준비 완료 — Firebase 프로젝트 연결 시 이 파일만 채우면 된다:
// 1) `npm i firebase` 후 initializeApp(firebaseConfig) + getMessaging()
// 2) getToken({vapidKey})으로 토큰 발급 → api.registerPush(token)
// 3) firebase-messaging-sw.js 서비스워커 추가
// 4) 워커 시크릿: npx wrangler secret put FCM_SERVICE_ACCOUNT
import { api } from './api'

export async function registerFcmToken(): Promise<boolean> {
  const config = import.meta.env.VITE_FIREBASE_CONFIG
  if (!config) return false // Firebase 미설정 — 로컬 Notification API만 사용
  try {
    // Firebase SDK 연동 지점 (설정 추가 전까지 도달하지 않음)
    const token: string | null = null
    if (token) {
      await api.registerPush(token)
      return true
    }
  } catch (e) {
    console.warn('FCM register failed:', e)
  }
  return false
}
