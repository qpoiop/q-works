import type { Milestone, Task } from '../types'
import EmptyState from '../components/EmptyState'
import TeamJoinCard from '../components/TeamJoinCard'
import { diffDays, dueMeta, fmtDate } from '../lib/date'

interface Props {
  milestones: Milestone[]
  tasks: Task[]
  inTeam: boolean
  onOpen: (id: string) => void
}

export default function MilestoneView({ milestones, tasks, inTeam, onOpen }: Props) {
  if (!inTeam) {
    return (
      <TeamJoinCard
        title="팀 마일스톤은 팀 참여 후 볼 수 있어요"
        description="팀 메뉴에서 팀 코드를 입력해 참여해 주세요."
      />
    )
  }
  if (milestones.length === 0) return <EmptyState message="등록된 마일스톤이 없어요." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {milestones.map((m) => {
        const ts = m.taskIds.map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => !!t)
        const done = ts.filter((t) => t.status === '완료').length
        const percent = ts.length ? Math.round((done / ts.length) * 100) : 0
        const dl = diffDays(m.due)
        const remainLabel = dl < 0 ? '기한 지남' : dl === 0 ? '오늘까지' : `${dl}일 남음`
        return (
          <div key={m.id} style={{ background: '#fff', border: '1px solid #eceef1', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ flex: 'none', width: 10, height: 10, borderRadius: '50%', background: m.color, marginTop: 6 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.2px' }}>{m.title}</div>
                <div style={{ fontSize: 12.5, color: '#8a94a6', marginTop: 2 }}>목표 {fmtDate(m.due)} · {remainLabel}</div>
              </div>
              <div style={{ flex: 'none', textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{percent}%</div>
                <div style={{ fontSize: 11.5, color: '#9aa0aa' }}>{done}/{ts.length} 완료</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: '#eef0f3', margin: '14px 0 16px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: m.color, borderRadius: 6, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ts.length === 0 && (
                <div style={{ fontSize: 12.5, color: '#9aa0aa', textAlign: 'center', padding: '10px 0' }}>연결된 업무가 없어요.</div>
              )}
              {ts.map((mt) => {
                const mtDone = mt.status === '완료'
                const due = dueMeta(mt.due, mtDone)
                const checkBorder = mtDone ? 'oklch(0.58 0.13 150)' : '#cbd0d8'
                const checkBg = mtDone ? 'oklch(0.58 0.13 150)' : '#fff'
                return (
                  <div
                    key={mt.id}
                    className="ms-task-row"
                    onClick={() => onOpen(mt.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#f8f9fb', cursor: 'pointer' }}
                  >
                    <span style={{
                      flex: 'none', width: 16, height: 16, borderRadius: 5, border: `2px solid ${checkBorder}`,
                      background: checkBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9
                    }}>
                      {mtDone ? '✓' : ''}
                    </span>
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 500, textDecoration: mtDone ? 'line-through' : 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {mt.title}
                    </span>
                    <span style={{ flex: 'none', fontSize: 11.5, color: '#8a94a6' }}>{mt.assignee}</span>
                    <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: due.bg, color: due.color }}>
                      {due.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
