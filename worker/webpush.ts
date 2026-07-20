// 표준 Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) — Web Crypto만 사용, Firebase/서비스계정 불필요.
// .env의 VAPID 키쌍 사용: 공개키(클라 구독)·비밀키(서버 서명, 워커 시크릿 VAPID_PRIVATE).

export interface PushSubscriptionRecord {
  endpoint: string
  p256dh: string // 클라 공개키 (base64url, 65B)
  auth: string // 인증 시크릿 (base64url, 16B)
}

export interface WebPushEnv {
  DB?: D1Database
  VAPID_PUBLIC?: string
  VAPID_PRIVATE?: string
  VAPID_SUBJECT?: string
}

/* ---------- base64url ---------- */
function b64uToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function bytesToB64u(b: Uint8Array): string {
  let s = ''
  for (const x of b) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function concat(...arr: Uint8Array[]): Uint8Array {
  const len = arr.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(len)
  let o = 0
  for (const a of arr) {
    out.set(a, o)
    o += a.length
  }
  return out
}

/* ---------- VAPID JWT (ES256) ---------- */
// P-256 raw scalar(32B) private key → PKCS8 for importKey
function rawPrivateToPkcs8(rawPriv: Uint8Array, rawPub: Uint8Array): Uint8Array {
  // PKCS8 ECPrivateKey wrapper for prime256v1 with public key included
  const header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20
  ])
  const mid = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00])
  return concat(header, rawPriv, mid, rawPub)
}

async function importVapidSigningKey(env: WebPushEnv): Promise<CryptoKey> {
  const priv = b64uToBytes(env.VAPID_PRIVATE!)
  const pub = b64uToBytes(env.VAPID_PUBLIC!)
  const pkcs8 = rawPrivateToPkcs8(priv, pub)
  return crypto.subtle.importKey('pkcs8', pkcs8.buffer as ArrayBuffer, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
}

async function vapidAuthHeader(env: WebPushEnv, endpoint: string): Promise<string> {
  const aud = new URL(endpoint).origin
  const header = bytesToB64u(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = bytesToB64u(
    new TextEncoder().encode(
      JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT || 'mailto:admin@example.com' })
    )
  )
  const signingInput = `${header}.${payload}`
  const key = await importVapidSigningKey(env)
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput)))
  const jwt = `${signingInput}.${bytesToB64u(sig)}`
  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`
}

/* ---------- aes128gcm 페이로드 암호화 (RFC 8291) ---------- */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm.buffer as ArrayBuffer, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, info: info.buffer as ArrayBuffer },
    key,
    len * 8
  )
  return new Uint8Array(bits)
}

async function encryptPayload(sub: PushSubscriptionRecord, plaintext: Uint8Array): Promise<Uint8Array> {
  const uaPublic = b64uToBytes(sub.p256dh)
  const authSecret = b64uToBytes(sub.auth)

  // 서버 임시 ECDH 키쌍
  const asKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey)) // 65B

  // ECDH 공유 비밀
  const uaPubKey = await crypto.subtle.importKey('raw', uaPublic.buffer as ArrayBuffer, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdhBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPubKey }, asKeyPair.privateKey, 256)
  const ecdhSecret = new Uint8Array(ecdhBits)

  // IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info"\0 ua_pub as_pub)
  const keyInfo = concat(new TextEncoder().encode('WebPush: info\0'), uaPublic, asPublicRaw)
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12)

  // 평문 + 0x02 패딩 구분자
  const padded = concat(plaintext, new Uint8Array([0x02]))
  const aesKey = await crypto.subtle.importKey('raw', cek.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt'])
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer }, aesKey, padded.buffer as ArrayBuffer)
  )

  // 헤더: salt(16) | rs(4)=4096 | idlen(1)=65 | as_public(65) | ciphertext
  const rs = new Uint8Array([0x00, 0x00, 0x10, 0x00])
  const idlen = new Uint8Array([asPublicRaw.length])
  return concat(salt, rs, idlen, asPublicRaw, ct)
}

/* ---------- 발송 ---------- */
/** 단일 구독으로 발송. 만료(404/410)면 삭제 대상 true 반환 */
async function sendOne(env: WebPushEnv, sub: PushSubscriptionRecord, payload: string): Promise<{ gone: boolean }> {
  const body = await encryptPayload(sub, new TextEncoder().encode(payload))
  const auth = await vapidAuthHeader(env, sub.endpoint)
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '2419200'
    },
    body: body.buffer as ArrayBuffer
  })
  return { gone: res.status === 404 || res.status === 410 }
}

/** 사용자의 모든 구독으로 푸시. 만료 구독은 정리. */
export async function sendPushToUser(env: WebPushEnv, nickname: string, title: string, body: string): Promise<void> {
  if (!env.DB || !env.VAPID_PRIVATE || !env.VAPID_PUBLIC) return
  const rows = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_nickname = ?')
    .bind(nickname)
    .all<PushSubscriptionRecord>()
  if (!rows.results.length) return

  const payload = JSON.stringify({ title, body, url: '/' })
  await Promise.allSettled(
    rows.results.map(async (sub) => {
      try {
        const { gone } = await sendOne(env, sub, payload)
        if (gone) await env.DB!.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(sub.endpoint).run()
      } catch (e) {
        console.error('web push send error:', e)
      }
    })
  )
}
