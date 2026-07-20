import { useState } from 'react'
import type { Me, Task } from '../types'
import { PRIORITY_META, WEEKDAY_HEADS } from '../config/meta'
import { dueMeta, fmtDate, toDateStr, today, weekdayOf } from '../lib/date'
import TaskCard from '../components/TaskCard'

interface Props {
  tasks: Task[]
  me: Me | null
  year: number
  month: number // 0-based
  onShift: (delta: number) => void
  onToday: () => void
  onOpen: (id: string) => void
  canEdit: (t: Task) => boolean
  onToggle: (id: string) => void
}

const MAX_CHIPS = 3

export default function CalendarView({ tasks, me, year, month, onShift, onToday, onOpen, canEdit, onToggle }: Props) {
  const [dayOpen, setDayOpen] = useState<string | null>(null) // 선택한 날짜(YYYY-MM-DD) 업무 레이어
  const rel = tasks.filter((t) => t.assignee === me?.nickname || t.isPublic)
  const first = new Date(year, month, 1)
  const start = first.getDay()
  const dim = new Date(year, month + 1, 0).getDate()
  const prevDim = new Date(year, month, 0).getDate()
  const todayStr = toDateStr(today())
  const pad = (n: number) => String(n).padStart(2, '0')

  const cells: { dayNum: number; other: boolean; dateStr?: string }[] = []
  for (let i = start - 1; i >= 0; i--) cells.push({ dayNum: prevDim - i, other: true })
  for (let d = 1; d <= dim; d++) cells.push({ dayNum: d, other: false, dateStr: `${year}-${pad(month + 1)}-${pad(d)}` })
  while (cells.length % 7 !== 0) cells.push({ dayNum: cells.length - start - dim + 1, other: true })

  const navBtn = {
    height: 34, borderRadius: 9, border: '1px solid #e0e3e8', background: '#fff', color: '#4b5563', cursor: 'pointer'
  } as const

  return (
    <div style={{ background: '#fff', border: '1px solid #eceef1', borderRadius: 16, padding: '18px 20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{year}년 {month + 1}월</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-ghost" onClick={() => onShift(-1)} style={{ ...navBtn, width: 34, fontSize: 16 }}>‹</button>
          <button className="btn-ghost" onClick={onToday} style={{ ...navBtn, padding: '0 12px', fontSize: 12.5, fontWeight: 600 }}>오늘</button>
          <button className="btn-ghost" onClick={() => onShift(1)} style={{ ...navBtn, width: 34, fontSize: 16 }}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
        {WEEKDAY_HEADS.map((wd) => (
          <div key={wd.label} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: wd.color, padding: '4px 0' }}>
            {wd.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {cells.map((c, i) => {
          if (c.other) {
            return (
              <div key={i} style={{ minHeight: 88, borderRadius: 10, border: '1px solid #f0f1f4', background: '#fafbfc', padding: '6px 7px', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#c2c8d2', marginBottom: 4 }}>{c.dayNum}</div>
              </div>
            )
          }
          const isToday = c.dateStr === todayStr
          const dayTasks = rel.filter((t) => t.due === c.dateStr)
          const chips = dayTasks.slice(0, MAX_CHIPS)
          return (
            <div
              key={i}
              onClick={() => { if (dayTasks.length > 0) setDayOpen(c.dateStr!) }}
              style={{
                minHeight: 88, borderRadius: 10, padding: '6px 7px', overflow: 'hidden',
                border: `1px solid ${isToday ? 'oklch(0.82 0.08 264)' : '#eef0f3'}`,
                background: isToday ? 'oklch(0.97 0.03 264)' : '#fff',
                cursor: dayTasks.length > 0 ? 'pointer' : 'default'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? 'oklch(0.46 0.17 264)' : '#4b5563', marginBottom: 4 }}>
                {c.dayNum}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {chips.map((t) => {
                  const due = dueMeta(t.due, t.status === '완료')
                  return (
                    <div
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); onOpen(t.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 500, padding: '2px 5px',
                        borderRadius: 5, background: due.bg === '#eef0f3' ? '#f4f6f9' : due.bg, color: '#4b5563',
                        cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}
                    >
                      <span style={{ flex: 'none', width: 5, height: 5, borderRadius: '50%', background: PRIORITY_META[t.priority].dot }} />
                      {t.title}
                    </div>
                  )
                })}
                {dayTasks.length > MAX_CHIPS && (
                  <div style={{ fontSize: 10, color: '#9aa0aa', paddingLeft: 5 }}>+{dayTasks.length - MAX_CHIPS}건</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {dayOpen && (() => {
        const dayTasks = rel.filter((t) => t.due === dayOpen)
        return (
          <div
            className="overlay-fade"
            onClick={() => setDayOpen(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(16,24,40,.32)', zIndex: 50,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
            }}
          >
            <div
              className="anim-slide"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 560, maxHeight: '72vh', background: '#fff',
                borderRadius: '18px 18px 0 0', boxShadow: '0 -12px 40px rgba(16,24,40,.22)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}
            >
              <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #eef0f3' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {fmtDate(dayOpen)} {weekdayOf(dayOpen)}요일
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#8a94a6' }}>{dayTasks.length}건</span>
                </div>
                <button onClick={() => setDayOpen(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f2f3f5', fontSize: 15, color: '#6b7280', cursor: 'pointer' }}>
                  ×
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {dayTasks.map((t) => (
                  <TaskCard key={t.id} task={t} editable={canEdit(t)} onOpen={(id) => { setDayOpen(null); onOpen(id) }} onToggle={onToggle} />
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
