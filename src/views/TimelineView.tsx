import type { Me, Task } from '../types'
import TaskCard from '../components/TaskCard'
import EmptyState from '../components/EmptyState'
import { diffDays, fmtDate, weekdayOf } from '../lib/date'

interface Props {
  tasks: Task[]
  me: Me | null
  canEdit: (t: Task) => boolean
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

interface GroupMeta {
  dot: string
  labelColor: string
  badge?: { label: string; bg: string; color: string }
}

function groupMeta(diff: number): GroupMeta {
  if (diff < 0)
    return { dot: 'oklch(0.62 0.19 25)', labelColor: 'oklch(0.5 0.19 25)', badge: { label: '지남', bg: 'oklch(0.95 0.04 25)', color: 'oklch(0.5 0.19 25)' } }
  if (diff === 0)
    return { dot: 'oklch(0.54 0.16 264)', labelColor: 'oklch(0.44 0.17 264)', badge: { label: '오늘', bg: 'oklch(0.95 0.05 264)', color: 'oklch(0.46 0.17 264)' } }
  if (diff === 1)
    return { dot: 'oklch(0.72 0.15 65)', labelColor: 'oklch(0.5 0.14 65)', badge: { label: '내일', bg: 'oklch(0.96 0.06 75)', color: 'oklch(0.5 0.14 65)' } }
  return { dot: '#c2c8d2', labelColor: '#1a1d21' }
}

export default function TimelineView({ tasks, me, canEdit, onOpen, onToggle }: Props) {
  const rel = tasks.filter((t) => t.assignee === me?.nickname || t.isPublic)
  const byDate = new Map<string, Task[]>()
  rel.forEach((t) => byDate.set(t.due, [...(byDate.get(t.due) ?? []), t]))
  const dates = [...byDate.keys()].sort()

  if (dates.length === 0) return <EmptyState message="타임라인에 표시할 업무가 없어요." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {dates.map((d) => {
        const meta = groupMeta(diffDays(d))
        const group = [...byDate.get(d)!].sort((a, b) => Number(a.status === '완료') - Number(b.status === '완료'))
        return (
          <div key={d} style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 'none', width: 118, paddingTop: 2, textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: meta.labelColor }}>{fmtDate(d)}</div>
              <div style={{ fontSize: 11.5, color: '#9aa0aa' }}>{weekdayOf(d)}요일</div>
              {meta.badge && (
                <span style={{
                  display: 'inline-block', marginTop: 5, fontSize: 10.5, fontWeight: 700, padding: '2px 7px',
                  borderRadius: 7, background: meta.badge.bg, color: meta.badge.color
                }}>
                  {meta.badge.label}
                </span>
              )}
            </div>
            <div style={{ flex: 'none', position: 'relative', width: 14, display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: 5, bottom: -2, width: 2, background: '#e4e7ec' }} />
              <div style={{
                position: 'relative', zIndex: 1, width: 12, height: 12, borderRadius: '50%', background: meta.dot,
                border: '2px solid #fff', boxShadow: `0 0 0 1px ${meta.dot}`, marginTop: 3
              }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
              {group.map((t) => (
                <TaskCard key={t.id} task={t} editable={canEdit(t)} onOpen={onOpen} onToggle={onToggle} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
