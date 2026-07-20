import type { AppNotification, Task } from './types'
import schema1 from '../migrations/0001_init.sql'
import schema2 from '../migrations/0002_auth_teams.sql'
import schema3 from '../migrations/0003_push_subscriptions.sql'
import {
  FIELD_LIMITS, MAX_NOTIFICATIONS, MAX_TASKS,
  bodyTooLarge, checkRateLimit, isCrossSiteMutation, withSecurityHeaders
} from './security'
import type { RateLimiterBinding } from './security'
import {
  createSession, deleteSession, getSessionUser, hashPassword,
  sessionClearCookie, sessionSetCookie
} from './auth'
import type { SessionUser } from './auth'
import { sendPushToUser } from './webpush'

export interface Env {
  DB?: D1Database
  ASSETS: Fetcher
  AVATARS?: R2Bucket
  RL_READ?: RateLimiterBinding
  RL_WRITE?: RateLimiterBinding
  VAPID_PUBLIC?: string
  VAPID_PRIVATE?: string
  VAPID_SUBJECT?: string
}

const MAX_AVATAR_BYTES = 1024 * 1024 // R2 저장 원본 상한 (1MB)

/* ---------- 공통 응답 ---------- */
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } })
const error = (status: number, message: string) => json({ error: message }, status)

class LimitError extends Error {}

/* ---------- 마이그레이션 (CLI 권한 없는 토큰 대응: 워커가 직접 적용) ---------- */
const MIGRATIONS: { name: string; sql: string }[] = [
  { name: '0001_init', sql: schema1 },
  { name: '0002_auth_teams', sql: schema2 },
  { name: '0003_push_subscriptions', sql: schema3 }
]

/** 시안 시드 멤버 + 체험 계정 — users 시드용 (비밀번호 '1234') */
const SEED_MEMBERS = ['테스터', '김하늘', '김서연', '박준호', '이지훈', '최유나', '정민석', '한소희', '강태오']

let migrated: Promise<void> | null = null

function ensureMigrated(db: D1Database): Promise<void> {
  return (migrated ??= (async () => {
    await db.prepare('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)').run()
    const done = new Set(
      (await db.prepare('SELECT name FROM _migrations').all<{ name: string }>()).results.map((r) => r.name)
    )
    for (const m of MIGRATIONS) {
      if (done.has(m.name)) continue
      const statements = m.sql
        .split(';')
        .map((s) => s.replace(/^--.*$/gm, '').trim())
        .filter(Boolean)
      // ALTER 중복 등은 개별 실행으로 관대하게 처리 (IF NOT EXISTS 없는 구문 대비)
      for (const s of statements) {
        try {
          await db.prepare(s).run()
        } catch (e) {
          if (!/duplicate column/i.test(String(e))) throw e
        }
      }
      await db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))").bind(m.name).run()
    }
    // 시드 유저 (체험 계정 포함: 비밀번호 1234, 팀 PROD2026) — 빠진 멤버만 추가 (기존 DB에도 적용)
    const placeholders = SEED_MEMBERS.map(() => '?').join(',')
    const existing = new Set(
      (await db.prepare(`SELECT nickname FROM users WHERE nickname IN (${placeholders})`).bind(...SEED_MEMBERS).all<{ nickname: string }>())
        .results.map((r) => r.nickname)
    )
    for (const name of SEED_MEMBERS) {
      if (existing.has(name)) continue
      const salt = crypto.randomUUID()
      const hash = await hashPassword('1234', salt)
      await db
        .prepare('INSERT OR IGNORE INTO users (nickname, password_hash, salt, team_code, avatar) VALUES (?, ?, ?, ?, NULL)')
        .bind(name, hash, salt, 'PROD2026')
        .run()
    }
  })().catch((e) => {
    migrated = null
    throw e
  }))
}

/* ---------- row <-> model ---------- */
interface TaskRow {
  id: string; title: string; content: string; assignee: string; due: string
  priority: Task['priority']; status: Task['status']; tags: string
  is_public: number; locked: number; team_code: string | null; allow_edit: number; prev_status: Task['status'] | null
  notify_update: number; notify_remind: number; notify_deadline: number
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id, title: r.title, content: r.content, assignee: r.assignee, due: r.due,
    priority: r.priority, status: r.status,
    tags: JSON.parse(r.tags || '[]') as string[],
    isPublic: !!r.is_public,
    team: r.team_code, allowEdit: !!r.allow_edit, prevStatus: r.prev_status,
    notify: { update: !!r.notify_update, remind: !!r.notify_remind, deadline: !!r.notify_deadline }
  }
}

interface NotifRow {
  id: string; type: AppNotification['type']; task_id: string | null
  task_title: string; detail: string; created_at: string; read: number
}

function rowToNotif(r: NotifRow): AppNotification {
  return { id: r.id, type: r.type, taskId: r.task_id, taskTitle: r.task_title, desc: r.detail, createdAt: r.created_at, read: !!r.read }
}

/* ---------- 검증 ---------- */
const PRIORITIES = ['높음', '보통', '낮음']
const STATUSES = ['예정', '진행중', '완료']
const NOTIF_TYPES = ['임박', '업데이트', '리마인드']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validateTaskInput(body: Partial<Task>, partial: boolean): string | null {
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return '제목을 입력해주세요'
    if (body.title.length > FIELD_LIMITS.title) return `제목은 ${FIELD_LIMITS.title}자 이하여야 해요`
  }
  if (body.content !== undefined && (typeof body.content !== 'string' || body.content.length > FIELD_LIMITS.content))
    return `상세 내용은 ${FIELD_LIMITS.content}자 이하여야 해요`
  if (body.assignee !== undefined && (typeof body.assignee !== 'string' || body.assignee.length > FIELD_LIMITS.assignee))
    return '담당자 값이 올바르지 않아요'
  if (body.due !== undefined && !DATE_RE.test(String(body.due))) return '마감일 형식이 올바르지 않아요'
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) return '우선순위 값이 올바르지 않아요'
  if (body.status !== undefined && !STATUSES.includes(body.status)) return '상태 값이 올바르지 않아요'
  if (body.prevStatus !== undefined && body.prevStatus !== null && !STATUSES.includes(body.prevStatus)) return '상태 값이 올바르지 않아요'
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > FIELD_LIMITS.tagCount) return '태그 형식이 올바르지 않아요'
    if (body.tags.some((t) => typeof t !== 'string' || t.length > FIELD_LIMITS.tagLength))
      return `태그는 ${FIELD_LIMITS.tagLength}자 이하여야 해요`
  }
  return null
}

const validNickname = (n: unknown): n is string =>
  typeof n === 'string' && !!n.trim() && n.trim().length <= FIELD_LIMITS.assignee

/* ---------- 태스크 접근 제어 ---------- */
const canSee = (t: TaskRow, me: SessionUser) =>
  t.assignee === me.nickname || (!!t.is_public && !!me.teamCode && t.team_code === me.teamCode)
const canEdit = (t: TaskRow, me: SessionUser) => t.assignee === me.nickname || !!t.allow_edit

async function getTaskRow(db: D1Database, id: string): Promise<TaskRow | null> {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<TaskRow>()
}

/* ---------- API ---------- */
const API_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']

async function handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '')
  const method = request.method
  const isWrite = method !== 'GET'
  const isAvatarUpload = path === '/api/me/avatar' && method === 'POST' // 바이너리 업로드(더 큰 본문 허용)

  // ---- 과금 방어·보안 게이트 ----
  if (!API_METHODS.includes(method)) return error(405, '허용되지 않은 메서드예요')
  if (isWrite) {
    if (isCrossSiteMutation(request)) return error(403, '허용되지 않은 요청이에요')
    if (isAvatarUpload) {
      const len = Number(request.headers.get('content-length') ?? '0')
      if (len > MAX_AVATAR_BYTES) return error(413, '이미지가 너무 커요 (최대 1MB)')
    } else {
      if (bodyTooLarge(request)) return error(413, '요청 크기가 너무 커요')
      if (['POST', 'PATCH', 'PUT'].includes(method) && !(request.headers.get('content-type') ?? '').includes('application/json'))
        return error(415, '요청 형식이 올바르지 않아요')
    }
  }
  if (!(await checkRateLimit(request, isWrite, isWrite ? env.RL_WRITE : env.RL_READ)))
    return error(429, '요청이 너무 많아요. 잠시 후 다시 시도해주세요.')

  if (!env.DB) return error(503, '데이터베이스가 연결되지 않았어요')
  const db = env.DB

  try {
    await ensureMigrated(db)

    /* ----- 인증 불필요 라우트 ----- */
    if (path === '/api/auth/signup' && method === 'POST') {
      const b = (await request.json()) as { nickname?: string; password?: string; teamCode?: string }
      const nick = (b.nickname ?? '').trim()
      if (!validNickname(nick)) return error(400, '닉네임을 입력하세요.')
      if (typeof b.password !== 'string' || b.password.length < 4) return error(400, '비밀번호는 4자 이상이어야 해요.')
      if (b.password.length > 100) return error(400, '비밀번호가 너무 길어요')
      const tc = (b.teamCode ?? '').trim().toUpperCase()
      if (tc) {
        const team = await db.prepare('SELECT code FROM teams WHERE code = ?').bind(tc).first()
        if (!team) return error(400, '존재하지 않는 팀 코드예요. (비워두면 무소속으로 시작)')
      }
      const dup = await db.prepare('SELECT id FROM users WHERE nickname = ?').bind(nick).first()
      if (dup) return error(409, '이미 사용 중인 닉네임이에요.')
      const salt = crypto.randomUUID()
      const hash = await hashPassword(b.password, salt)
      const ins = await db
        .prepare('INSERT INTO users (nickname, password_hash, salt, team_code) VALUES (?, ?, ?, ?)')
        .bind(nick, hash, salt, tc || null)
        .run()
      const userId = ins.meta.last_row_id as number
      const token = await createSession(db, userId)
      return json({ ok: true }, 201, { 'set-cookie': sessionSetCookie(token) })
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const b = (await request.json()) as { nickname?: string; password?: string }
      const nick = (b.nickname ?? '').trim()
      if (!nick || typeof b.password !== 'string' || !b.password) return error(400, '닉네임과 비밀번호를 입력하세요.')
      const u = await db.prepare('SELECT id, password_hash, salt FROM users WHERE nickname = ?').bind(nick)
        .first<{ id: number; password_hash: string; salt: string }>()
      if (!u || (await hashPassword(b.password, u.salt)) !== u.password_hash)
        return error(401, '닉네임 또는 비밀번호가 올바르지 않아요.')
      const token = await createSession(db, u.id)
      return json({ ok: true }, 200, { 'set-cookie': sessionSetCookie(token) })
    }

    /* ----- 이하 인증 필요 ----- */
    const me = await getSessionUser(db, request)
    if (!me) return error(401, '로그인이 필요해요')

    if (path === '/api/auth/logout' && method === 'POST') {
      await deleteSession(db, request)
      return json({ ok: true }, 200, { 'set-cookie': sessionClearCookie() })
    }

    if (path === '/api/bootstrap' && method === 'GET') {
      const teamName = me.teamCode
        ? ((await db.prepare('SELECT name FROM teams WHERE code = ?').bind(me.teamCode).first<{ name: string }>())?.name ?? me.teamCode)
        : null
      const [tasks, roster, milestones, links, notifs] = await Promise.all([
        me.teamCode
          ? db.prepare('SELECT * FROM tasks WHERE assignee = ? OR (is_public = 1 AND team_code = ?) ORDER BY due, id').bind(me.nickname, me.teamCode).all<TaskRow>()
          : db.prepare('SELECT * FROM tasks WHERE assignee = ? ORDER BY due, id').bind(me.nickname).all<TaskRow>(),
        me.teamCode
          ? db.prepare('SELECT nickname, avatar FROM users WHERE team_code = ? ORDER BY id').bind(me.teamCode).all<{ nickname: string; avatar: string | null }>()
          : db.prepare('SELECT nickname, avatar FROM users WHERE nickname = ?').bind(me.nickname).all<{ nickname: string; avatar: string | null }>(),
        db.prepare('SELECT * FROM milestones ORDER BY sort').all(),
        db.prepare('SELECT * FROM milestone_tasks ORDER BY milestone_id, sort').all<{ milestone_id: string; task_id: string }>(),
        db.prepare('SELECT * FROM notifications WHERE user_nickname = ? ORDER BY created_at DESC LIMIT 50').bind(me.nickname).all<NotifRow>()
      ])
      const linkMap = new Map<string, string[]>()
      for (const l of links.results) linkMap.set(l.milestone_id, [...(linkMap.get(l.milestone_id) ?? []), l.task_id])
      return json({
        me: { nickname: me.nickname, teamCode: me.teamCode, teamName, avatar: me.avatar },
        roster: roster.results,
        tasks: tasks.results.map(rowToTask),
        milestones: me.teamCode
          ? milestones.results.map((m) => ({
              id: m.id as string, title: m.title as string, due: m.due as string,
              color: m.color as string, taskIds: linkMap.get(m.id as string) ?? []
            }))
          : [],
        notifications: notifs.results.map(rowToNotif)
      })
    }

    if (path === '/api/me' && method === 'PATCH') {
      const b = (await request.json()) as { nickname?: string; password?: string; avatar?: string | null }
      const updates: string[] = []
      const binds: unknown[] = []
      if (b.nickname !== undefined) {
        const nick = (b.nickname ?? '').trim()
        if (!validNickname(nick)) return error(400, '닉네임을 입력하세요')
        if (nick !== me.nickname) {
          const dup = await db.prepare('SELECT id FROM users WHERE nickname = ?').bind(nick).first()
          if (dup) return error(409, '이미 사용 중인 닉네임이에요')
          updates.push('nickname = ?'); binds.push(nick)
        }
      }
      if (b.password) {
        if (typeof b.password !== 'string' || b.password.length < 4) return error(400, '비밀번호는 4자 이상이어야 해요')
        const salt = crypto.randomUUID()
        updates.push('password_hash = ?', 'salt = ?'); binds.push(await hashPassword(b.password, salt), salt)
      }
      // 아바타는 /api/me/avatar (R2)로 처리 — PATCH에서는 무시
      if (updates.length) {
        await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...binds, me.id).run()
        // 닉네임 변경 시 담당 업무·알림도 함께 이관
        if (b.nickname !== undefined && b.nickname.trim() !== me.nickname) {
          const nick = b.nickname.trim()
          await db.batch([
            db.prepare('UPDATE tasks SET assignee = ? WHERE assignee = ?').bind(nick, me.nickname),
            db.prepare('UPDATE notifications SET user_nickname = ? WHERE user_nickname = ?').bind(nick, me.nickname),
            db.prepare('UPDATE push_subscriptions SET user_nickname = ? WHERE user_nickname = ?').bind(nick, me.nickname)
          ])
        }
      }
      const fresh = await db.prepare('SELECT nickname, team_code, avatar FROM users WHERE id = ?').bind(me.id)
        .first<{ nickname: string; team_code: string | null; avatar: string | null }>()
      return json({ nickname: fresh!.nickname, teamCode: fresh!.team_code, avatar: fresh!.avatar })
    }

    if (path === '/api/me/nickname-check' && method === 'GET') {
      const nick = (url.searchParams.get('nick') ?? '').trim()
      if (!nick) return json({ status: 'empty' })
      if (nick === me.nickname) return json({ status: 'same' })
      const dup = await db.prepare('SELECT id FROM users WHERE nickname = ?').bind(nick).first()
      return json({ status: dup ? 'dup' : 'ok' })
    }

    // 아바타 업로드 (바이너리 이미지 본문 → R2 저장, D1엔 URL만)
    if (path === '/api/me/avatar' && method === 'POST') {
      if (!env.AVATARS) return error(503, '이미지 저장소가 연결되지 않았어요')
      const ct = request.headers.get('content-type') ?? ''
      if (!ct.startsWith('image/')) return error(415, '이미지 파일만 업로드할 수 있어요')
      const buf = await request.arrayBuffer()
      if (buf.byteLength === 0) return error(400, '빈 파일이에요')
      if (buf.byteLength > MAX_AVATAR_BYTES) return error(413, '이미지가 너무 커요 (최대 1MB)')
      const key = `av/${me.id}`
      await env.AVATARS.put(key, buf, { httpMetadata: { contentType: ct, cacheControl: 'public, max-age=31536000, immutable' } })
      const urlPath = `/avatars/${key}?v=${Date.now()}` // 변경 즉시 반영되도록 버전 쿼리
      await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(urlPath, me.id).run()
      return json({ avatar: urlPath })
    }

    if (path === '/api/me/avatar' && method === 'DELETE') {
      if (env.AVATARS) await env.AVATARS.delete(`av/${me.id}`).catch(() => {})
      await db.prepare('UPDATE users SET avatar = NULL WHERE id = ?').bind(me.id).run()
      return json({ avatar: null })
    }

    if (path === '/api/team/join' && method === 'POST') {
      const b = (await request.json()) as { code?: string }
      const code = (b.code ?? '').trim().toUpperCase()
      if (!code) return error(400, '팀 코드를 입력하세요.')
      const team = await db.prepare('SELECT code, name FROM teams WHERE code = ?').bind(code).first<{ code: string; name: string }>()
      if (!team) return error(404, '존재하지 않는 팀 코드예요.')
      await db.prepare('UPDATE users SET team_code = ? WHERE id = ?').bind(code, me.id).run()
      return json({ teamCode: team.code, teamName: team.name })
    }

    if (path === '/api/team/leave' && method === 'POST') {
      await db.prepare('UPDATE users SET team_code = NULL WHERE id = ?').bind(me.id).run()
      return json({ ok: true })
    }

    if (path === '/api/tasks' && method === 'POST') {
      const body = (await request.json()) as Omit<Task, 'id'>
      const invalid = validateTaskInput(body, false)
      if (invalid) return error(400, invalid)
      const cnt = await db.prepare('SELECT COUNT(*) AS c FROM tasks').first<{ c: number }>()
      if ((cnt?.c ?? 0) >= MAX_TASKS) throw new LimitError('업무 수가 한도에 도달했어요. 완료된 업무를 정리해주세요.')
      const id = crypto.randomUUID()
      await db
        .prepare(
          `INSERT INTO tasks (id, title, content, assignee, due, priority, status, tags, is_public, locked, team_code, allow_edit, prev_status, notify_update, notify_remind, notify_deadline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, ?, ?, ?)`
        )
        .bind(
          id, body.title.trim(), body.content ?? '', body.assignee || me.nickname, body.due, body.priority, body.status,
          JSON.stringify(body.tags ?? []), body.isPublic ? 1 : 0, me.teamCode, body.allowEdit === false ? 0 : 1,
          body.notify?.update ? 1 : 0, body.notify?.remind ? 1 : 0, body.notify?.deadline ? 1 : 0
        )
        .run()
      const row = await getTaskRow(db, id)
      return json(rowToTask(row!), 201)
    }

    const taskMatch = path.match(/^\/api\/tasks\/([^/]+)$/)
    if (taskMatch) {
      const id = decodeURIComponent(taskMatch[1])
      if (id.length > FIELD_LIMITS.id) return error(400, '잘못된 업무 ID예요')
      const row = await getTaskRow(db, id)
      if (!row || !canSee(row, me)) return error(404, '업무를 찾을 수 없어요')

      if (method === 'PATCH' || method === 'PUT') {
        if (!canEdit(row, me)) return error(403, '다른 담당자가 편집을 제한한 업무예요')
        const body = (await request.json()) as Partial<Task>
        const invalid = validateTaskInput(body, true)
        if (invalid) return error(400, invalid)
        const cur = rowToTask(row)
        const next: Task = { ...cur, ...body, id, notify: { ...cur.notify, ...(body.notify ?? {}) } }
        await db
          .prepare(
            `UPDATE tasks SET title=?, content=?, assignee=?, due=?, priority=?, status=?, tags=?, is_public=?, allow_edit=?, prev_status=?,
             notify_update=?, notify_remind=?, notify_deadline=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`
          )
          .bind(
            next.title, next.content, next.assignee, next.due, next.priority, next.status,
            JSON.stringify(next.tags), next.isPublic ? 1 : 0, next.allowEdit === false ? 0 : 1, next.prevStatus ?? null,
            next.notify.update ? 1 : 0, next.notify.remind ? 1 : 0, next.notify.deadline ? 1 : 0, id
          )
          .run()
        return json(next)
      }
      if (method === 'DELETE') {
        if (!canEdit(row, me)) return error(403, '다른 담당자가 편집을 제한한 업무예요')
        await db.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
        return new Response(null, { status: 204 })
      }
    }

    if (path === '/api/notifications' && method === 'POST') {
      const body = (await request.json()) as { type: AppNotification['type']; taskId?: string | null; taskTitle: string; desc: string }
      if (
        !NOTIF_TYPES.includes(body.type) ||
        typeof body.taskTitle !== 'string' || !body.taskTitle || body.taskTitle.length > FIELD_LIMITS.title ||
        typeof body.desc !== 'string' || !body.desc || body.desc.length > FIELD_LIMITS.desc ||
        (body.taskId != null && (typeof body.taskId !== 'string' || body.taskId.length > FIELD_LIMITS.id))
      )
        return error(400, '알림 형식이 올바르지 않아요')
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      await db.batch([
        db.prepare('INSERT INTO notifications (id, type, task_id, task_title, detail, created_at, read, user_nickname) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
          .bind(id, body.type, body.taskId ?? null, body.taskTitle, body.desc, createdAt, me.nickname),
        db.prepare('DELETE FROM notifications WHERE user_nickname = ? AND id NOT IN (SELECT id FROM notifications WHERE user_nickname = ? ORDER BY created_at DESC LIMIT ?)')
          .bind(me.nickname, me.nickname, MAX_NOTIFICATIONS)
      ])
      // Web Push (VAPID 설정 시에만 발송) — 앱이 닫혀 있어도 도착
      ctx.waitUntil(sendPushToUser(env, me.nickname, `업무 알림 · ${body.taskTitle}`, body.desc))
      return json({ id, type: body.type, taskId: body.taskId ?? null, taskTitle: body.taskTitle, desc: body.desc, createdAt, read: false }, 201)
    }

    if (path === '/api/notifications/read-all' && method === 'POST') {
      await db.prepare('UPDATE notifications SET read = 1 WHERE user_nickname = ? AND read = 0').bind(me.nickname).run()
      return new Response(null, { status: 204 })
    }

    // 클라 VAPID 공개키 조회 (구독에 필요)
    if (path === '/api/push/vapid-public' && method === 'GET') {
      return json({ key: env.VAPID_PUBLIC ?? null })
    }

    // 실제 Web Push 테스트 발송 (내 구독 대상)
    if (path === '/api/push/test' && method === 'POST') {
      const subs = await db.prepare('SELECT COUNT(*) AS c FROM push_subscriptions WHERE user_nickname = ?').bind(me.nickname).first<{ c: number }>()
      if ((subs?.c ?? 0) === 0) return error(409, '구독된 기기가 없어요. 알림을 먼저 켜주세요.')
      ctx.waitUntil(sendPushToUser(env, me.nickname, '팀 작업 관리 · 테스트', '푸시 알림이 정상 동작해요. 🎉'))
      return json({ ok: true, devices: subs!.c })
    }

    if (path === '/api/push/subscribe' && method === 'POST') {
      const b = (await request.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      if (
        typeof b.endpoint !== 'string' || !/^https:\/\//.test(b.endpoint) || b.endpoint.length > 1024 ||
        !b.keys || typeof b.keys.p256dh !== 'string' || typeof b.keys.auth !== 'string' ||
        b.keys.p256dh.length > 200 || b.keys.auth.length > 100
      )
        return error(400, '구독 정보가 올바르지 않아요')
      await db
        .prepare('INSERT OR REPLACE INTO push_subscriptions (endpoint, user_nickname, p256dh, auth) VALUES (?, ?, ?, ?)')
        .bind(b.endpoint, me.nickname, b.keys.p256dh, b.keys.auth)
        .run()
      return json({ ok: true }, 201)
    }

    if (path === '/api/push/unsubscribe' && method === 'POST') {
      const b = (await request.json()) as { endpoint?: string }
      if (typeof b.endpoint === 'string' && b.endpoint) await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(b.endpoint).run()
      return json({ ok: true })
    }

    return error(404, '요청한 API를 찾을 수 없어요')
  } catch (e) {
    if (e instanceof SyntaxError) return error(400, '요청 본문이 올바르지 않아요')
    if (e instanceof LimitError) return error(429, e.message)
    console.error('API error:', e)
    return error(500, '서버 오류가 발생했어요')
  }
}

/** R2 아바타 공개 서빙 (/avatars/av/<id>) */
async function serveAvatar(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 })
  if (!env.AVATARS) return new Response('Not Found', { status: 404 })
  const key = decodeURIComponent(new URL(request.url).pathname.replace(/^\/avatars\//, ''))
  if (!/^av\/\d+$/.test(key)) return new Response('Not Found', { status: 404 })
  const obj = await env.AVATARS.get(key)
  if (!obj) return new Response('Not Found', { status: 404 })
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  return new Response(request.method === 'HEAD' ? null : obj.body, { headers })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      return withSecurityHeaders(await handleApi(request, env, ctx), true)
    }
    if (url.pathname.startsWith('/avatars/')) {
      return withSecurityHeaders(await serveAvatar(request, env), false)
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withSecurityHeaders(error(405, '허용되지 않은 메서드예요'), true)
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request), false)
  }
} satisfies ExportedHandler<Env>
