import type { Me, Task } from '../types'
import TaskCard from '../components/TaskCard'
import EmptyState from '../components/EmptyState'
import { diffDays } from '../lib/date'

interface Props {
  tasks: Task[]
  me: Me | null
  canEdit: (t: Task) => boolean
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

export default function TodayView({ tasks, me, canEdit, onOpen, onToggle }: Props) {
  const mine = tasks.filter((t) => t.assignee === me?.nickname)
  const myActive = mine.filter((t) => t.status !== '완료')
  const overdue = myActive.filter((t) => diffDays(t.due) < 0).sort((a, b) => diffDays(a.due) - diffDays(b.due))
  const todayTasks = myActive.filter((t) => diffDays(t.due) === 0)
  const upcoming = myActive.filter((t) => diffDays(t.due) > 0).sort((a, b) => diffDays(a.due) - diffDays(b.due))
  const stats = {
    remaining: myActive.length,
    due: myActive.filter((t) => diffDays(t.due) <= 0).length,
    done: mine.filter((t) => t.status === '완료').length
  }

  const cards = (list: Task[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
      {list.map((t) => (
        <TaskCard key={t.id} task={t} editable={canEdit(t)} onOpen={onOpen} onToggle={onToggle} />
      ))}
    </div>
  )

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        <div style={{ background: '#fff', border: '1px solid #eceef1', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12.5, color: '#8a94a6', fontWeight: 600 }}>남은 작업</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, letterSpacing: -1 }}>{stats.remaining}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eceef1', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12.5, color: 'oklch(0.5 0.19 25)', fontWeight: 600 }}>오늘·지연 마감</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, letterSpacing: -1, color: 'oklch(0.5 0.19 25)' }}>{stats.due}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eceef1', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 12.5, color: 'oklch(0.5 0.12 150)', fontWeight: 600 }}>완료</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, letterSpacing: -1, color: 'oklch(0.5 0.12 150)' }}>{stats.done}</div>
        </div>
      </div>

      {overdue.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'oklch(0.5 0.19 25)' }}>마감 초과</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.5 0.19 25)', background: 'oklch(0.95 0.04 25)', padding: '2px 8px', borderRadius: 8 }}>
              {overdue.length}
            </span>
          </div>
          {cards(overdue)}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>오늘 할 일</span>
        <span style={{ fontSize: 12, color: '#8a94a6' }}>{todayTasks.length}건</span>
      </div>
      {todayTasks.length > 0 ? cards(todayTasks) : <EmptyState message="오늘 마감인 내 업무가 없어요." style={{ marginBottom: 24 }} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>앞으로 할 일</span>
      </div>
      {upcoming.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {upcoming.map((t) => (
            <TaskCard key={t.id} task={t} editable={canEdit(t)} onOpen={onOpen} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <EmptyState message="예정된 업무가 없어요." />
      )}
    </>
  )
}
