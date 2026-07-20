import { memo } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { Task } from '../types'
import { PRIORITY_META, STATUS_META, memberMeta } from '../config/meta'
import { dueMeta } from '../lib/date'

interface Props {
  task: Task
  editable: boolean // canEdit: 담당자 본인이거나 팀원 편집 허용
  onOpen: (id: string) => void
  onToggle: (id: string) => void // 완료 토글 (권한 검사는 상위에서)
}

/** 시안 TaskCard.dc.html + v2 완료 토글·권한 상태 1:1 구현 */
function TaskCard({ task, editable, onOpen, onToggle }: Props) {
  const done = task.status === '완료'
  const due = dueMeta(task.due, done)
  const st = STATUS_META[task.status]
  const pri = PRIORITY_META[task.priority]
  const member = memberMeta(task.assignee)

  // 시안 v2 체크 버튼 상태
  let checkBg = '#fff'
  let checkBorder = '#cbd0d8'
  let checkMarkColor = 'transparent'
  let checkCursor: CSSProperties['cursor'] = 'pointer'
  let checkTitle = '완료 처리'
  let checkClass = ''
  if (!done && task.status === '진행중') checkBorder = 'oklch(0.6 0.14 264)'
  if (done) {
    checkBg = 'oklch(0.58 0.13 150)'
    checkBorder = 'oklch(0.58 0.13 150)'
    checkMarkColor = '#fff'
    checkTitle = '완료 취소'
    checkClass = 'check-done'
  }
  if (!done && editable) checkClass = 'check-can'
  if (!editable) {
    checkCursor = 'default'
    checkTitle = '편집 권한 없음'
    checkClass = ''
    if (!done) {
      checkBg = '#f7f8fa'
      checkBorder = '#e4e7ec'
    }
  }

  const toggle = (e: MouseEvent) => {
    e.stopPropagation()
    onToggle(task.id)
  }

  return (
    <div
      className="task-card"
      onClick={() => onOpen(task.id)}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
        background: '#fff', border: '1px solid #eceef1', borderRadius: 14, cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(16,24,40,.04)', opacity: done ? 0.64 : 1
      }}
    >
      <button
        className={checkClass}
        onClick={toggle}
        title={checkTitle}
        style={{
          flex: 'none', marginTop: 1, width: 24, height: 24, borderRadius: '50%',
          border: `2px solid ${checkBorder}`, background: checkBg, color: checkMarkColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, lineHeight: 1, cursor: checkCursor, padding: 0, transition: 'all .15s'
        }}
      >
        ✓
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: pri.dot }} />
          <span style={{
            fontSize: 15, fontWeight: 600, color: '#1a1d21',
            textDecoration: done ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {task.title}
          </span>
          <span style={{ flex: 'none', marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {!editable && (
              <span title="다른 담당자가 편집을 제한함" style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: '#f2f3f5', color: '#9aa0aa' }}>
                잠김
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
              background: task.isPublic ? 'oklch(0.96 0.03 264)' : '#f2f3f5',
              color: task.isPublic ? 'oklch(0.5 0.14 264)' : '#9aa0aa'
            }}>
              {task.isPublic ? '공개' : '비공개'}
            </span>
          </span>
        </div>
        {task.content && (
          <div style={{ marginTop: 4, fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.content}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 7, background: due.bg, color: due.color }}>
            {due.label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 7, background: st.bg, color: st.color }}>
            {task.status}
          </span>
          {task.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, color: '#6b7280', background: '#f2f3f5', padding: '3px 7px', borderRadius: 6 }}>
              #{tag}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              flex: 'none', width: 22, height: 22, borderRadius: '50%', background: member.color, color: '#fff',
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {member.short}
            </span>
            <span style={{ fontSize: 12, color: '#4b5563', fontWeight: 500 }}>{task.assignee}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(TaskCard)
