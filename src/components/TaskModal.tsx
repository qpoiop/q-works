import { useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import type { NotifySettings, Priority, Status, TaskForm } from '../types'
import { COLOR, PRIORITY_META, STATUS_META } from '../config/meta'

interface Props {
  form: TaskForm
  isEdit: boolean
  readOnly: boolean // 다른 담당자가 편집 제한한 업무 열람
  memberNames: string[]
  onSave: (form: TaskForm) => void
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
const checkboxStyle: CSSProperties = { width: 17, height: 17, accentColor: COLOR.primary, cursor: 'pointer' }
const checkLabelStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, cursor: 'pointer' }

const NOTIFY_OPTIONS: { key: keyof NotifySettings; label: string }[] = [
  { key: 'deadline', label: '기간 임박 (마감 하루 전·당일)' },
  { key: 'remind', label: '리마인드 (예정 작업 사전 안내)' },
  { key: 'update', label: '작업 업데이트 (상태 변경 시)' }
]

export default function TaskModal({ form: initial, isEdit, readOnly, memberNames, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<TaskForm>(initial)
  const set = <K extends keyof TaskForm>(k: K, v: TaskForm[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setText = (k: 'title' | 'content' | 'assignee' | 'due' | 'tags') =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value)

  const modalTitle = readOnly ? '업무 상세' : isEdit ? '업무 편집' : '새 업무 등록'
  const editHint = form.allowEdit
    ? '팀원 누구나 이 업무를 편집하고 완료 처리할 수 있어요.'
    : '담당자 본인만 편집·완료 처리할 수 있어요.'

  return (
    <div className="overlay-fade" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(16,24,40,.32)', zIndex: 50,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflowY: 'auto'
    }}>
      <div className="anim-pop" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560, margin: 'auto', background: '#fff', borderRadius: 18,
        boxShadow: '0 24px 60px rgba(16,24,40,.28)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #eef0f3' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{modalTitle}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: '#f2f3f5', fontSize: 16, color: '#6b7280', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px 22px', maxHeight: '66vh', overflowY: 'auto' }}>
          {readOnly && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 11,
              background: '#f2f3f5', color: '#6b7280', fontSize: 12.5, fontWeight: 500, marginBottom: 16
            }}>
              <span style={{ flex: 'none', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#e4e7ec', color: '#8a94a6' }}>
                읽기 전용
              </span>
              {form.assignee}님이 편집을 제한한 업무예요. 내용만 확인할 수 있어요.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, pointerEvents: readOnly ? 'none' : 'auto' }}>
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
          <div>
            <label style={labelStyle}>
              태그 <span style={{ color: '#9aa0aa', fontWeight: 400 }}>(쉼표로 구분)</span>
            </label>
            <input value={form.tags} onChange={setText('tags')} placeholder="예: 마케팅, 3분기" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>공개 범위</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => set('isPublic', false)} style={segStyle(!form.isPublic, '#5b6472')}>비공개 (나만)</button>
              <button onClick={() => set('isPublic', true)} style={segStyle(form.isPublic)}>공개 (팀 공유)</button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>편집 권한</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => set('allowEdit', true)} style={segStyle(form.allowEdit, 'oklch(0.58 0.13 150)')}>팀원 편집 허용</button>
              <button onClick={() => set('allowEdit', false)} style={segStyle(!form.allowEdit, '#5b6472')}>나만 편집</button>
            </div>
            <div style={{ fontSize: 11.5, color: '#9aa0aa', marginTop: 6 }}>{editHint}</div>
          </div>
          <div style={{ borderTop: '1px solid #eef0f3', paddingTop: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 9 }}>알림 받기</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {NOTIFY_OPTIONS.map((opt) => (
                <label key={opt.key} style={checkLabelStyle}>
                  <input
                    type="checkbox"
                    checked={form.notify[opt.key]}
                    onChange={(e) => set('notify', { ...form.notify, [opt.key]: e.target.checked })}
                    style={checkboxStyle}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderTop: '1px solid #eef0f3', background: '#fafbfc' }}>
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
                  style={{
                    height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid oklch(0.88 0.05 25)',
                    background: '#fff', color: 'oklch(0.55 0.19 25)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={onClose}
                style={{
                  marginLeft: 'auto', height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid #e0e3e8',
                  background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={() => onSave(form)}
                style={{
                  height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: COLOR.primary,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px oklch(0.54 0.16 264/.3)'
                }}
              >
                {isEdit ? '저장' : '등록'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
