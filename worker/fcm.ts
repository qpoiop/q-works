// FCM HTTP v1 발송 로직.
// 시크릿 미설정 시 조용히 no-op — 클라이언트 Firebase 연동 후 아래 시크릿만 넣으면 동작:
//   npx wrangler secret put FCM_SERVICE_ACCOUNT   # Firebase 서비스 계정 JSON 전체
// 서비스 계정 JSON의 project_id/client_email/private_key를 사용한다.

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

export interface FcmEnv {
  DB?: D1Database
  FCM_SERVICE_ACCOUNT?: string
}

let cachedToken: { token: string; exp: number } | null = null

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

/** 서비스 계정 JWT → OAuth2 액세스 토큰 (55분 캐시) */
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    })
  )
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`))
  const jwt = `${header}.${claims}.${b64url(new Uint8Array(sig))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`
  })
  if (!res.ok) throw new Error(`FCM oauth failed: ${res.status}`)
  const body = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: body.access_token, exp: now + Math.min(body.expires_in, 3600) - 300 }
  return cachedToken.token
}

/** 사용자의 등록된 모든 기기로 푸시. 실패(만료 토큰)는 정리. */
export async function sendPushToUser(env: FcmEnv, nickname: string, title: string, body: string): Promise<void> {
  if (!env.DB || !env.FCM_SERVICE_ACCOUNT) return
  let sa: ServiceAccount
  try {
    sa = JSON.parse(env.FCM_SERVICE_ACCOUNT) as ServiceAccount
  } catch {
    console.error('FCM_SERVICE_ACCOUNT is not valid JSON')
    return
  }
  const rows = await env.DB.prepare('SELECT token FROM push_tokens WHERE user_nickname = ?').bind(nickname).all<{ token: string }>()
  if (!rows.results.length) return

  let accessToken: string
  try {
    accessToken = await getAccessToken(sa)
  } catch (e) {
    console.error('FCM token error:', e)
    return
  }

  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  await Promise.allSettled(
    rows.results.map(async ({ token }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: { fcm_options: { link: '/' } }
          }
        })
      })
      if (res.status === 404 || res.status === 400) {
        // 만료/무효 토큰 정리
        await env.DB!.prepare('DELETE FROM push_tokens WHERE token = ?').bind(token).run()
      }
    })
  )
}
