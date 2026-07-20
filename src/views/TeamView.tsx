import type { Task } from '../types'
import { COLOR } from '../config/meta'
import TaskCard from '../components/TaskCard'
import EmptyState from '../components/EmptyState'
import TeamJoinCard from '../components/TeamJoinCard'
import { diffDays } from '../lib/date'

interface Props {
  tasks: Task[]
  inTeam: boolean
  canEdit: (t: Task) => boolean
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}

export default function TeamView({ tasks, inTeam, canEdit, onOpen, onToggle }: Props) {
  if (!inTeam) {
    return (
      <TeamJoinCard
        title="팀에 참여해 보세요"
        description="아직 소속된 팀이 없어요. 팀 코드를 입력하면 팀의 공개 업무·타임라인·마일스톤을 함께 볼 수 있어요."
        showDemoCodes
      />
    )
  }
  const teamTasks = tasks.filter((t) => t.isPublic).sort((a, b) => diffDays(a.due) - diffDays(b.due))

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12,
        background: 'oklch(0.97 0.02 264)', border: '1px solid oklch(0.9 0.04 264)', marginBottom: 16
      }}>
        <span style={{ flex: 'none', width: 8, height: 8, borderRadius: '50%', background: COLOR.primary }} />
        <span style={{ fontSize: 12.5, color: 'oklch(0.42 0.1 264)' }}>
          공개로 설정된 팀 업무 {teamTasks.length}건이 실시간으로 공유되고 있어요.
        </span>
      </div>
      {teamTasks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {teamTasks.map((t) => (
            <TaskCard key={t.id} task={t} editable={canEdit(t)} onOpen={onOpen} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <EmptyState message="공개된 팀 업무가 없어요." />
      )}
    </>
  )
}
