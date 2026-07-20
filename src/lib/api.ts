import type { AppNotification, Bootstrap, Me, NickCheckStatus, Task } from '../types'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    ...init
  })
  if (!res.ok) {
    let msg = `요청에 실패했어요 (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) msg = body.error
    } catch {
      /* body 없음 */
    }
    throw new ApiError(res.status, msg)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  bootstrap: () => request<Bootstrap>('/api/bootstrap'),
  signup: (nickname: string, password: string, teamCode: string) =>
    request<{ ok: true }>('/api/auth/signup', { method: 'POST', body: JSON.stringify({ nickname, password, teamCode }) }),
  login: (nickname: string, password: string) =>
    request<{ ok: true }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ nickname, password }) }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST', body: '{}' }),
  updateMe: (patch: { nickname?: string; password?: string; avatar?: string | null }) =>
    request<Pick<Me, 'nickname' | 'teamCode' | 'avatar'>>('/api/me', { method: 'PATCH', body: JSON.stringify(patch) }),
  nicknameCheck: (nick: string) =>
    request<{ status: NickCheckStatus }>(`/api/me/nickname-check?nick=${encodeURIComponent(nick)}`),
  joinTeam: (code: string) =>
    request<{ teamCode: string; teamName: string }>('/api/team/join', { method: 'POST', body: JSON.stringify({ code }) }),
  leaveTeam: () => request<{ ok: true }>('/api/team/leave', { method: 'POST', body: '{}' }),
  createTask: (task: Omit<Task, 'id'>) =>
    request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id: string, patch: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
  createNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) =>
    request<AppNotification>('/api/notifications', { method: 'POST', body: JSON.stringify(n) }),
  markAllRead: () => request<void>('/api/notifications/read-all', { method: 'POST', body: '{}' }),
  registerPush: (token: string, platform = 'web') =>
    request<{ ok: true }>('/api/push/register', { method: 'POST', body: JSON.stringify({ token, platform }) }),
  unregisterPush: (token: string) =>
    request<{ ok: true }>('/api/push/unregister', { method: 'POST', body: JSON.stringify({ token }) })
}

export { ApiError }
