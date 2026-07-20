// 프런트엔드 src/types.ts 와 동일한 API 계약 타입 (워커 빌드 독립성을 위해 분리)
export type Priority = '높음' | '보통' | '낮음'
export type Status = '예정' | '진행중' | '완료'
export type NotifType = '임박' | '업데이트' | '리마인드'

export interface NotifySettings {
  update: boolean
  remind: boolean
  deadline: boolean
}

export interface Task {
  id: string
  title: string
  content: string
  assignee: string
  due: string
  priority: Priority
  status: Status
  tags: string[]
  isPublic: boolean
  team: string | null
  allowEdit: boolean
  prevStatus: Status | null
  notify: NotifySettings
}

export interface Member {
  id: number
  name: string
  short: string
  color: string
  team: string
  isMe: boolean
}

export interface Milestone {
  id: string
  title: string
  due: string
  color: string
  taskIds: string[]
}

export interface AppNotification {
  id: string
  type: NotifType
  taskId: string | null
  taskTitle: string
  desc: string
  createdAt: string
  read: boolean
}

export interface Bootstrap {
  members: Member[]
  tasks: Task[]
  milestones: Milestone[]
  notifications: AppNotification[]
}
