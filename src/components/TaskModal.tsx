import { useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import type { NotifySettings, Priority, Status, TaskForm } from '../types'
import { COLOR, PRIORITY_META, STATUS_META, memberMeta } from '../config/meta'
import { dueMeta, fmtDate } from '../lib/date'

interface Props {
  form: TaskForm
  isEdit: boolean
  readOnly: boolean // 다른 담당자가 편집 제한한 업무 열람
  memberNames: string[]
  onSave: (form: TaskForm) => Promise<void> | void
  onDelete: () => void
  onClose: () => void
}

/** 시안 seg 버튼 스타일 */
function segStyle(active: boolean, color: string = COLOR.primary): CSSProperties {
  return {
    flex: 1, padding: '9px 0', fontSize: 12.5, fontWeight: 600, borderRadius: 9, cursor: 'pointer',
    transition: 'all .12s', border: `1px solid ${active ? 'transparent' : '#e0e3e8'}`,
    background: active ? color : '#fff', color: active ? '#fff' : '#5b6472'
  }
}

const labelStyle: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4b5563', marginBottom: 6 }
const inputStyle: CSSProperties = {
  width: '100%', height: 42, padding: '0 13px', border: '1px solid #e0e3e8', borderRadius: 10, fontSize: 14, background: '#fff'
}

/** 알림 종류 칩 (다중 선택) */
type NotifyKey = 'update' | 'deadline' | 'daily'
const NOTIFY_OPTIONS: { key: NotifyKey; label: string }[] = [
  { key: 'update', label: '변경 시' },
  { key: 'deadline', label: '마감일 도래 시' },
  { key: 'daily', label: '매일' }
]

/** 발송 시각 고정 슬롯 (cron 부하 관리 — worker NOTIFY_SLOTS와 일치) */
const NOTIFY_SLOTS: { value: string; label: string }[] = [
  { value: '10:00', label: '오전 10시' },
  { value: '16:00', label: '오후 4시' }
]

/** 알림 칩 — segStyle과 달리 내용 너비(flex 없음) */
function chipStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 9, cursor: 'pointer',
    transition: 'all .12s', border: `1px solid ${active ? 'transparent' : '#e0e3e8'}`,
    background: active ? COLOR.primary : '#fff', color: active ? '#fff' : '#5b6472'
  }
}

const accordionHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 0',
  border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#4b5563'
}

const roLabel: CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#8a94a6', width: 88, flex: 'none' }
const roRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 30 }

/** 읽기전용: 편집 컨트롤 대신 요약 정보만 표시 */
function ReadOnlyDetail({ form }: { form: TaskForm }) {
  const done = form.status === '완료'
  const due = dueMeta(form.due, done)
  const st = STATUS_META[form.status]
  const pri = PRIORITY_META[form.priority]
  const member = memberMeta(form.assignee)
  const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 11,
        background: '#f2f3f5', color: '#6b7280', fontSize: 12.5, fontWeight: 500
      }}>
        <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#e4e7ec', color: '#8a94a6' }}>
          읽기 전용
        </span>
        {form.assignee}님이 편집을 제한한 업무예요. 내용만 확인할 수 있어요.
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.2px', lineHeight: 1.4 }}>{form.title}</div>
        {form.content && (
          <div style={{ marginTop: 8, fontSize: 13.5, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{form.content}</div>
        )}
      </div>
      <div style={{ borderTop: '1px solid #eef0f3', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={roRow}>
          <span style={roLabel}>담당자</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: member.color, color: '#fff',
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {member.short}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{form.assignee}</span>
          </span>
        </div>
        <div style={roRow}>
          <span style={roLabel}>마감일</span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 7, background: due.bg, color: due.color }}>{due.label}</span>
          <span style={{ fontSize: 12.5, color: '#8a94a6' }}>{fmtDate(form.due)}</span>
        </div>
        <div style={roRow}>
          <span style={roLabel}>우선순위 · 상태</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: pri.dot }} />{form.priority}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 7, background: st.bg, color: st.color }}>{form.status}</span>
        </div>
        {tags.length > 0 && (
          <div style={roRow}>
            <span style={roLabel}>태그</span>
            <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <span key={tag} style={{ fontSize: 11.5, color: '#6b7280', background: '#f2f3f5', padding: '3px 8px', borderRadius: 6 }}>#{tag}</span>
              ))}
            </span>
          </div>
        )}
        <div style={roRow}>
          <span style={roLabel}>공개 범위</span>
          <span style={{
            fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
            background: form.isPublic ? 'oklch(0.96 0.03 264)' : '#f2f3f5',
            color: form.isPublic ? 'oklch(0.5 0.14 264)' : '#9aa0aa'
          }}>
            {form.isPublic ? '공개 (팀 공유)' : '비공개 (나만)'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function TaskModal({ form: initial, isEdit, readOnly, memberNames, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<TaskForm>(initial)
  const set = <K extends keyof TaskForm>(k: K, v: TaskForm[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setText = (k: 'title' | 'content' | 'assignee' | 'due' | 'tags') =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value)

  const [busy, setBusy] = useState(false)
  const inflight = useRef(false) // 동기 가드 — 같은 tick 이중 클릭도 차단

  const setNotify = (patch: Partial<NotifySettings>) => set('notify', { ...form.notify, ...patch })
  const notifOn = form.notify.update || form.notify.deadline || form.notify.daily
  const needTime = form.notify.deadline || form.notify.daily
  // 알림 마스터 토글: 끄면 전부 off, 켜면 '마감일 도래'만 기본 on
  const toggleNotif = () =>
    set('notify', notifOn ? { ...form.notify, update: false, deadline: false, daily: false } : { ...form.notify, deadline: true })

  // 고급 설정: 기본값과 다른 항목 있으면 펼친 채로 시작
  const [advOpen, setAdvOpen] = useState(
    () => form.tags.trim() !== '' || form.isPublic || !form.allowEdit || !form.notify.update || !form.notify.deadline || form.notify.daily
  )

  const modalTitle = readOnly ? '업무 상세' : isEdit ? '업무 편집' : '새 업무 등록'
  const editHint = form.allowEdit
    ? '팀원 누구나 이 업무를 편집하고 완료 처리할 수 있어요.'
    : '담당자 본인만 편집·완료 처리할 수 있어요.'

  // 중복 제출 방지: 저장 완료 전까지 재클릭 무시 (ref로 즉시 잠금)
  const submit = async () => {
    if (inflight.current) return
    inflight.current = true
    setBusy(true)
    try {
      await onSave(form)
    } finally {
      inflight.current = false
      setBusy(false)
    }
  }

  return (
    <div className="overlay-fade modal-overlay" onClick={onClose} style={{ zIndex: 50 }}>
      <div className="anim-pop modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #eef0f3' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{modalTitle}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: '#f2f3f5', fontSize: 16, color: '#6b7280', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div className="modal-scroll" style={{ padding: '20px 22px' }}>
          {readOnly ? (
            <ReadOnlyDetail form={form} />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>제목</label>
            <input value={form.title} onChange={setText('title')} placeholder="업무 제목을 입력하세요" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>상세 내용</label>
            <textarea
              value={form.content}
              onChange={setText('content')}
              placeholder="무엇을, 어떻게 진행할지 적어주세요"
              style={{ ...inputStyle, height: 'auto', minHeight: 84, padding: '11px 13px', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>담당자</label>
              <select value={form.assignee} onChange={setText('assignee')} style={{ ...inputStyle, padding: '0 11px', cursor: 'pointer' }}>
                {(memberNames.includes(form.assignee) ? memberNames : [form.assignee, ...memberNames]).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>마감일</label>
              <input type="date" value={form.due} onChange={setText('due')} style={{ ...inputStyle, padding: '0 12px', cursor: 'pointer' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>우선순위</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                  <button key={p} onClick={() => set('priority', p)} style={segStyle(form.priority === p, PRIORITY_META[p].seg)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>상태</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.keys(STATUS_META) as Status[]).map((s) => (
                  <button key={s} onClick={() => set('status', s)} style={segStyle(form.status === s, STATUS_META[s].seg)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 고급 설정 — 접기 (태그·공개 범위·편집 권한·알림) */}
          <div style={{ borderTop: '1px solid #eef0f3' }}>
            <button type="button" onClick={() => setAdvOpen((v) => !v)} style={accordionHeaderStyle}>
              고급 설정
              <span style={{ fontWeight: 400, fontSize: 11.5, color: '#9aa0aa' }}>태그 · 공개 범위 · 편집 권한 · 알림</span>
              <span style={{ marginLeft: 'auto', color: '#c2c8d2', fontSize: 12, transition: 'transform .15s', transform: advOpen ? 'rotate(90deg)' : 'none' }}>{'▶︎'}</span>
            </button>
            {advOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 2, paddingBottom: 4 }}>
                <div>
                  <label style={labelStyle}>
                    태그 <span style={{ color: '#9aa0aa', fontWeight: 400 }}>(쉼표로 구분)</span>
                  </label>
                  <input value={form.tags} onChange={setText('tags')} placeholder="예: 마케팅, 3분기" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>공개 범위</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => set('isPublic', false)} style={segStyle(!form.isPublic, '#5b6472')}>비공개</button>
                      <button onClick={() => set('isPublic', true)} style={segStyle(form.isPublic)}>공개</button>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>편집 권한</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => set('allowEdit', true)} style={segStyle(form.allowEdit, 'oklch(0.58 0.13 150)')}>팀원 허용</button>
                      <button onClick={() => set('allowEdit', false)} style={segStyle(!form.allowEdit, '#5b6472')}>나만</button>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#9aa0aa', marginTop: -6 }}>{editHint}</div>

                {/* 알림 — 마스터 토글 + 종류 칩(다중) + 발송 시각 */}
                <div style={{ borderTop: '1px solid #f2f3f5', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>알림 받기</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifOn}
                      onClick={toggleNotif}
                      style={{
                        position: 'relative', width: 42, height: 24, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
                        background: notifOn ? COLOR.primary : '#d5d9e0', transition: 'background .15s'
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, left: notifOn ? 21 : 3, width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', boxShadow: '0 1px 3px rgba(16,24,40,.3)', transition: 'left .15s'
                      }} />
                    </button>
                  </div>
                  {notifOn && (
                    <>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {NOTIFY_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setNotify({ [opt.key]: !form.notify[opt.key] })}
                            style={chipStyle(form.notify[opt.key])}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {needTime && (
                        <div style={{ marginTop: 12 }}>
                          <label style={{ ...labelStyle, marginBottom: 7 }}>
                            발송 시각 <span style={{ color: '#9aa0aa', fontWeight: 400 }}>(마감일 도래·매일 알림)</span>
                          </label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {NOTIFY_SLOTS.map((slot) => (
                              <button
                                key={slot.value}
                                type="button"
                                onClick={() => setNotify({ time: slot.value })}
                                style={segStyle(form.notify.time === slot.value)}
                              >
                                {slot.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
          )}
        </div>

        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid #eef0f3', background: '#fafbfc' }}>
          {readOnly ? (
            <button
              className="btn-ghost"
              onClick={onClose}
              style={{
                marginLeft: 'auto', height: 40, padding: '0 20px', borderRadius: 10, border: '1px solid #e0e3e8',
                background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}
            >
              닫기
            </button>
          ) : (
            <>
              {isEdit && (
                <button
                  className="btn-danger-ghost"
                  onClick={onDelete}
                  disabled={busy}
                  style={{
                    height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid oklch(0.88 0.05 25)',
                    background: '#fff', color: 'oklch(0.55 0.19 25)', fontSize: 13, fontWeight: 600,
                    cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1
                  }}
                >
                  삭제
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={onClose}
                disabled={busy}
                style={{
                  marginLeft: 'auto', height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid #e0e3e8',
                  background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1
                }}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={submit}
                disabled={busy}
                style={{
                  height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: COLOR.primary,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                  boxShadow: '0 2px 8px oklch(0.54 0.16 264/.3)', opacity: busy ? 0.7 : 1
                }}
              >
                {busy ? (isEdit ? '저장 중…' : '등록 중…') : isEdit ? '저장' : '등록'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
