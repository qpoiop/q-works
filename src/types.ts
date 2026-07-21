export type Priority = '높음' | '보통' | '낮음'
export type Status = '예정' | '진행중' | '완료'
export type NotifType = '임박' | '업데이트' | '리마인드'
export type ContentFormat = 'plain' | 'markdown'
export type ViewKey = 'today' | 'mytasks' | 'timeline' | 'milestone' | 'calendar' | 'team'

export interface NotifySettings {
  update: boolean // 변경 시
  deadline: boolean // 마감일 도래 시
  daily: boolean // 매일
  time: string // "HH:MM" — deadline·daily 발송 시각
}

export interface Task {
  id: string
  title: string
  content: string
  contentFormat: ContentFormat // 상세 내용 렌더 방식
  assignee: string
  due: string // YYYY-MM-DD
  priority: Priority
  status: Status
  tags: string[]
  isPublic: boolean // true = 공개(팀 공유), false = 비공개(나만)
  team: string | null
  allowEdit: boolean // false = 담당자만 편집·완료 처리
  prevStatus: Status | null // 완료 취소 시 복귀할 상태
  notify: NotifySettings
}

/** 현재 로그인 사용자 */
export interface Me {
  nickname: string
  teamCode: string | null
  teamName: string | null
  avatar: string | null
}

/** 팀 로스터 항목 */
export interface RosterUser {
  nickname: string
  avatar: string | null
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
  createdAt: string // ISO
  read: boolean
}

export interface TaskForm {
  id: string | null
  title: string
  content: string
  contentFormat: ContentFormat
  assignee: string
  due: string
  priority: Priority
  status: Status
  tags: string // comma-separated in the form
  isPublic: boolean
  allowEdit: boolean
  notify: NotifySettings
}

export interface Bootstrap {
  me: Me
  roster: RosterUser[]
  tasks: Task[]
  milestones: Milestone[]
  notifications: AppNotification[]
}

export interface AuthForm {
  nickname: string
  password: string
  teamCode: string
}

export type NickCheckStatus = 'ok' | 'dup' | 'same' | 'empty'
