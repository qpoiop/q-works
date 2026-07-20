// 세션·비밀번호 유틸 (데모 수준: SHA-256 + salt. 운영 전환 시 PBKDF2/argon2 권장)

export interface SessionUser {
  id: number
  nickname: string
  teamCode: string | null
  avatar: string | null
}

const SESSION_COOKIE = 'twm_session'
const SESSION_TTL_DAYS = 30

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function parseCookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {}
  const raw = request.headers.get('cookie') ?? ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

export function sessionSetCookie(token: string): string {
  const maxAge = SESSION_TTL_DAYS * 86400
  return `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`
}

export function sessionClearCookie(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`
}

export function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString()
}

export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, userId, sessionExpiry()).run()
  return token
}

export async function getSessionUser(db: D1Database, request: Request): Promise<SessionUser | null> {
  const token = parseCookies(request)[SESSION_COOKIE]
  if (!token || token.length > 128) return null
  const row = await db
    .prepare(
      `SELECT u.id, u.nickname, u.team_code, u.avatar FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')`
    )
    .bind(token)
    .first<{ id: number; nickname: string; team_code: string | null; avatar: string | null }>()
  if (!row) return null
  return { id: row.id, nickname: row.nickname, teamCode: row.team_code, avatar: row.avatar }
}

export async function deleteSession(db: D1Database, request: Request): Promise<void> {
  const token = parseCookies(request)[SESSION_COOKIE]
  if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
}
