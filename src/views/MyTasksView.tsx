import type { Me, Task } from '../types'
import type { MyFilter } from '../config/meta'
import { MY_FILTERS } from '../config/meta'
import TaskCard from '../components/TaskCard'
import EmptyState from '../components/EmptyState'
import { diffDays } from '../lib/date'

interface Props {
  tasks: Task[]
  me: Me | null
  filter: MyFilter
  onFilter: (f: MyFilter) => void
  canEdit: (t: Task) => boolean
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

export default function MyTasksView({ tasks, me, filter, onFilter, canEdit, onOpen, onToggle }: Props) {
  let list = tasks.filter((t) => t.assignee === me?.nickname)
  if (filter !== '전체') list = list.filter((t) => t.status === filter)
  list = [...list].sort(
    (a, b) => Number(a.status === '완료') - Number(b.status === '완료') || diffDays(a.due) - diffDays(b.due)
  )

  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {MY_FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => onFilter(f)}
              style={{
                padding: '7px 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                transition: 'all .12s', border: `1px solid ${active ? 'transparent' : '#e0e3e8'}`,
                background: active ? '#1a1d21' : '#fff', color: active ? '#fff' : '#5b6472'
              }}
            >
              {f}
            </button>
          )
        })}
      </div>
      {list.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {list.map((t) => (
            <TaskCard key={t.id} task={t} editable={canEdit(t)} onOpen={onOpen} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <EmptyState message="해당하는 업무가 없어요." />
      )}
    </>
  )
}
