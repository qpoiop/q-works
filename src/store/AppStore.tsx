import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppNotification, Bootstrap, Me, Milestone, NotifType, RosterUser, Status, Task, TaskForm } from '../types'
import { api, ApiError } from '../lib/api'
import { TOAST_COLOR } from '../config/meta'
import { diffDays } from '../lib/date'
import { fireBrowserNotif } from '../lib/notify'

export interface Toast {
  id: string
  msg: string
  color: string
  undoId: string | null // 완료 처리 되돌리기 대상 task id
}

export type AuthState = 'loading' | 'anon' | 'authed'

interface EmptyData {
  me: Me | null
  roster: RosterUser[]
  tasks: Task[]
  milestones: Milestone[]
  notifications: AppNotification[]
}

interface StoreValue extends EmptyData {
  auth: AuthState
  error: string | null
  reload: () => void
  toasts: Toast[]
  toast: (msg: string, color?: string, undoId?: string | null) => void
  dismissToast: (id: string) => void
  login: (nickname: string, password: string) => Promise<string | null>
  signup: (nickname: string, password: string, teamCode: string) => Promise<string | null>
  logout: () => Promise<void>
  updateProfile: (patch: { nickname?: string; password?: string; avatarBlob?: Blob | null }) => Promise<boolean>
  joinTeam: (code: string) => Promise<string | null>
  leaveTeam: () => Promise<void>
  saveTask: (form: TaskForm) => Promise<boolean>
  deleteTask: (id: string) => Promise<void>
  toggleDone: (id: string) => void
  canEdit: (t: Task) => boolean
  markAllRead: () => void
  pushNotification: (type: NotifType, task: Pick<Task, 'id' | 'title'>, desc: string) => void
}

const EMPTY: EmptyData = { me: null, roster: [], tasks: [], milestones: [], notifications: [] }

const StoreContext = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EmptyData>(EMPTY)
  const [toasts, setToasts] = useState<Toast[]>([])
  const dataRef = useRef(data)
  dataRef.current = data

  const dismissToast = useCallback((id: string) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (msg: string, color: string = TOAST_COLOR.info, undoId: string | null = null) => {
      const id = 'ts' + Date.now() + Math.random()
      setToasts((ts) => [...ts, { id, msg, color, undoId }])
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), undoId ? 5000 : 2800)
    },
    []
  )

  const load = useCallback(() => {
    setError(null)
    api
      .bootstrap()
      .then((d: Bootstrap) => {
        setData(d)
        setAuth('authed')
      })
      .catch((e: Error) => {
        if (e instanceof ApiError && e.status === 401) {
          setData(EMPTY)
          setAuth('anon')
        } else {
          setError(e.message || '데이터를 불러오지 못했어요')
          setAuth('authed') // 에러 화면은 앱 셸에서 표시
        }
      })
  }, [])

  useEffect(load, [load])

  const setTasks = (fn: (tasks: Task[]) => Task[]) => setData((d) => ({ ...d, tasks: fn(d.tasks) }))
  const setNotifications = (fn: (ns: AppNotification[]) => AppNotification[]) =>
    setData((d) => ({ ...d, notifications: fn(d.notifications) }))

  /* ---------- auth ---------- */
  const login = useCallback(async (nickname: string, password: string): Promise<string | null> => {
    try {
      await api.login(nickname, password)
      setAuth('loading')
      load()
      toast(`${nickname.trim()}님 환영합니다`, TOAST_COLOR.create)
      return null
    } catch (e) {
      return (e as Error).message
    }
  }, [load, toast])

  const signup = useCallback(async (nickname: string, password: string, teamCode: string): Promise<string | null> => {
    try {
      await api.signup(nickname, password, teamCode)
      setAuth('loading')
      load()
      toast('회원가입 완료! 환영합니다', TOAST_COLOR.create)
      return null
    } catch (e) {
      return (e as Error).message
    }
  }, [load, toast])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* 세션 만료 등 — 클라 상태만 정리 */
    }
    setData(EMPTY)
    setAuth('anon')
  }, [])

  // avatarBlob: Blob=업로드, null=삭제, undefined=변경없음
  const updateProfile = useCallback(
    async (patch: { nickname?: string; password?: string; avatarBlob?: Blob | null }): Promise<boolean> => {
      try {
        const oldNick = dataRef.current.me?.nickname
        let avatar = dataRef.current.me?.avatar ?? null
        // 아바타 먼저 처리(R2)
        if (patch.avatarBlob instanceof Blob) avatar = (await api.uploadAvatar(patch.avatarBlob)).avatar
        else if (patch.avatarBlob === null) avatar = (await api.deleteAvatar()).avatar
        // 닉네임/비밀번호
        let nickname = oldNick ?? ''
        if (patch.nickname !== undefined || patch.password) {
          const fresh = await api.updateMe({ nickname: patch.nickname, password: patch.password })
          nickname = fresh.nickname
        }
        setData((d) => ({
          ...d,
          me: d.me ? { ...d.me, nickname, avatar } : d.me,
          roster: d.roster.map((r) => (r.nickname === oldNick ? { ...r, nickname, avatar } : r)),
          tasks: oldNick && oldNick !== nickname ? d.tasks.map((t) => (t.assignee === oldNick ? { ...t, assignee: nickname } : t)) : d.tasks
        }))
        toast('프로필이 저장됐어요', TOAST_COLOR.edit)
        return true
      } catch (e) {
        toast((e as Error).message, TOAST_COLOR.danger)
        return false
      }
    },
    [toast]
  )

  const joinTeam = useCallback(async (code: string): Promise<string | null> => {
    try {
      const res = await api.joinTeam(code)
      toast(`${res.teamName}에 참여했어요`, TOAST_COLOR.create)
      load() // 팀 데이터(로스터·공개 업무·마일스톤) 재로드
      return null
    } catch (e) {
      return (e as Error).message
    }
  }, [load, toast])

  const leaveTeam = useCallback(async () => {
    try {
      await api.leaveTeam()
      toast('팀에서 나왔어요', 'oklch(0.6 0.15 45)')
      load()
    } catch (e) {
      toast((e as Error).message, TOAST_COLOR.danger)
    }
  }, [load, toast])

  /* ---------- notifications ---------- */
  const pushNotification = useCallback(
    (type: NotifType, task: Pick<Task, 'id' | 'title'>, desc: string) => {
      const local: AppNotification = {
        id: 'n' + Date.now() + Math.random(),
        type, taskId: task.id, taskTitle: task.title, desc,
        createdAt: new Date().toISOString(), read: false
      }
      setNotifications((ns) => [local, ...ns])
      api
        .createNotification({ type, taskId: task.id, taskTitle: task.title, desc })
        .then((saved) => setNotifications((ns) => ns.map((n) => (n.id === local.id ? saved : n))))
        .catch(() => {})
    },
    []
  )

  /* ---------- tasks ---------- */
  const canEdit = useCallback((t: Task): boolean => {
    const me = dataRef.current.me
    return !!me && (t.assignee === me.nickname || t.allowEdit !== false)
  }, [])

  const saveTask = useCallback(
    async (form: TaskForm): Promise<boolean> => {
      if (!form.title.trim()) {
        toast('제목을 입력해주세요', TOAST_COLOR.danger)
        return false
      }
      const me = dataRef.current.me
      const base: Omit<Task, 'id'> = {
        title: form.title.trim(),
        content: form.content.trim(),
        contentFormat: form.contentFormat,
        assignee: form.assignee,
        due: form.due,
        priority: form.priority,
        status: form.status,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublic: form.isPublic,
        allowEdit: form.allowEdit,
        team: me?.teamCode ?? null,
        prevStatus: null,
        notify: { ...form.notify }
      }
      try {
        if (form.id) {
          const prevTask = dataRef.current.tasks.find((t) => t.id === form.id)
          const prev = dataRef.current.tasks
          setTasks((ts) => ts.map((t) => (t.id === form.id ? { ...t, ...base } : t)))
          try {
            await api.updateTask(form.id, base)
          } catch (e) {
            setTasks(() => prev)
            throw e
          }
          toast('업무가 수정됐어요', TOAST_COLOR.edit)
          // '변경 시' 알림 — 담당자 본인이고 상태가 실제로 바뀐 경우
          if (base.notify.update && me && base.assignee === me.nickname && prevTask && prevTask.status !== base.status)
            pushNotification('업데이트', { id: form.id, title: base.title }, `상태가 ${base.status}(으)로 변경됐어요.`)
        } else {
          const created = await api.createTask(base)
          setTasks((ts) => [...ts, created])
          toast('새 업무가 등록됐어요', TOAST_COLOR.create)
        }
        const d = diffDays(form.due)
        if (form.notify.deadline && d >= 0 && d <= 1)
          fireBrowserNotif(base.title, d === 0 ? '오늘 마감이에요.' : '내일 마감이에요.')
        return true
      } catch (e) {
        toast((e as Error).message || '저장에 실패했어요', TOAST_COLOR.danger)
        return false
      }
    },
    [toast, pushNotification]
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const prev = dataRef.current.tasks
      setTasks((ts) => ts.filter((t) => t.id !== id))
      try {
        await api.deleteTask(id)
        toast('업무가 삭제됐어요', TOAST_COLOR.danger)
      } catch (e) {
        setTasks(() => prev)
        toast((e as Error).message || '삭제에 실패했어요', TOAST_COLOR.danger)
      }
    },
    [toast]
  )

  /** 완료 토글 (시안 v2: 완료 ↔ 이전 상태 복귀, 완료 시 되돌리기 토스트) */
  const toggleDone = useCallback(
    (id: string) => {
      const cur = dataRef.current.tasks.find((t) => t.id === id)
      const me = dataRef.current.me
      if (!cur || !me) return
      const done = cur.status === '완료'
      const next: Status = done ? cur.prevStatus ?? '진행중' : '완료'
      const patch: Partial<Task> = done ? { status: next, prevStatus: null } : { status: '완료', prevStatus: cur.status }
      const prev = dataRef.current.tasks
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      if (!done) toast(`'${cur.title}' 완료 처리했어요`, TOAST_COLOR.create, id)
      else toast(`'${cur.title}' 다시 ${next}(으)로`, TOAST_COLOR.status)
      if (cur.notify.update && cur.assignee === me.nickname)
        pushNotification('업데이트', cur, `상태가 ${done ? next : '완료'}(으)로 변경됐어요.`)
      api.updateTask(id, patch).catch(() => {
        setTasks(() => prev)
        toast('상태 변경에 실패했어요', TOAST_COLOR.danger)
      })
    },
    [toast, pushNotification]
  )

  const markAllRead = useCallback(() => {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
    api.markAllRead().catch(() => {})
  }, [])

  const value: StoreValue = {
    auth, error, reload: load,
    ...data,
    toasts, toast, dismissToast,
    login, signup, logout, updateProfile, joinTeam, leaveTeam,
    saveTask, deleteTask, toggleDone, canEdit,
    markAllRead, pushNotification
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within AppStoreProvider')
  return ctx
}
