import { useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import type { Me, NickCheckStatus } from '../types'
import { COLOR, memberMeta } from '../config/meta'
import { api } from '../lib/api'
import { blobPreviewUrl, fileToAvatarBlob } from '../lib/avatar'
import { useStore } from '../store/AppStore'
import { TOAST_COLOR } from '../config/meta'

const labelStyle: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4b5563', marginBottom: 6 }
const inputStyle: CSSProperties = {
  height: 42, padding: '0 13px', border: '1px solid #e0e3e8', borderRadius: 10, fontSize: 14
}

const NICK_MSG: Record<NickCheckStatus, { msg: string; color: string }> = {
  ok: { msg: '✓ 사용 가능한 닉네임이에요', color: 'oklch(0.5 0.13 150)' },
  dup: { msg: '이미 사용 중인 닉네임이에요', color: 'oklch(0.55 0.19 25)' },
  same: { msg: '현재 사용 중인 닉네임이에요', color: '#8a94a6' },
  empty: { msg: '닉네임을 입력하세요', color: 'oklch(0.55 0.19 25)' }
}

interface Props {
  me: Me
  onClose: () => void
  onLeaveTeam: () => void
}

/** 시안 v2 설정 모달: 프로필 사진·닉네임(중복확인)·비밀번호·팀 */
export default function SettingsModal({ me, onClose, onLeaveTeam }: Props) {
  const store = useStore()
  const [nickname, setNickname] = useState(me.nickname)
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState<string | null>(me.avatar) // 미리보기 URL(기존/blob:)
  const [avatarBlob, setAvatarBlob] = useState<Blob | null | undefined>(undefined) // Blob=신규, null=삭제, undefined=변경없음
  const [nickStatus, setNickStatus] = useState<NickCheckStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const previewName = nickname.trim() || me.nickname
  const meta = memberMeta(previewName)

  const checkNick = async () => {
    const nick = nickname.trim()
    if (!nick) {
      setNickStatus('empty')
      return
    }
    try {
      const { status } = await api.nicknameCheck(nick)
      setNickStatus(status)
    } catch {
      setNickStatus(null)
    }
  }

  const pickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const blob = await fileToAvatarBlob(file)
      setAvatarBlob(blob)
      setAvatar(blobPreviewUrl(blob)) // 저장 전 미리보기
    } catch (err) {
      store.toast((err as Error).message, TOAST_COLOR.danger)
    }
  }

  const removeAvatar = () => {
    setAvatarBlob(null)
    setAvatar(null)
  }

  const save = async () => {
    if (busy) return
    const nick = nickname.trim()
    if (!nick) {
      store.toast('닉네임을 입력하세요', TOAST_COLOR.danger)
      return
    }
    if (password && password.length < 4) {
      store.toast('비밀번호는 4자 이상이어야 해요', TOAST_COLOR.danger)
      return
    }
    const patch: { nickname?: string; password?: string; avatarBlob?: Blob | null } = {}
    if (nick !== me.nickname) patch.nickname = nick
    if (password) patch.password = password
    if (avatarBlob !== undefined) patch.avatarBlob = avatarBlob
    setBusy(true)
    try {
      if (await store.updateProfile(patch)) onClose()
    } finally {
      setBusy(false)
    }
  }

  const nickMsg = nickStatus ? NICK_MSG[nickStatus] : null

  return (
    <div className="overlay-fade modal-overlay" onClick={onClose} style={{ zIndex: 52 }}>
      <div className="anim-pop modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #eef0f3' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>설정</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: '#f2f3f5', fontSize: 16, color: '#6b7280', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div className="modal-scroll" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              flex: 'none', width: 72, height: 72, borderRadius: '50%',
              background: avatar ? `center/cover url(${avatar})` : meta.color,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22
            }}>
              {avatar ? '' : meta.short}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
                프로필 사진 <span style={{ color: '#9aa0aa', fontWeight: 400 }}>(최대 4MB)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="btn-ghost" style={{
                  height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid #e0e3e8', background: '#fff',
                  fontSize: 12.5, fontWeight: 600, color: '#4b5563', cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
                }}>
                  사진 업로드
                  <input type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />
                </label>
                {avatar && (
                  <button className="btn-ghost" onClick={removeAvatar} style={{
                    height: 36, padding: '0 12px', borderRadius: 9, border: '1px solid #e0e3e8', background: '#fff',
                    fontSize: 12.5, fontWeight: 600, color: '#8a94a6', cursor: 'pointer'
                  }}>
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>닉네임</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setNickStatus(null) }}
                placeholder="닉네임"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={checkNick} style={{
                flex: 'none', height: 42, padding: '0 15px', borderRadius: 10, border: `1px solid ${COLOR.primary}`,
                background: 'oklch(0.96 0.03 264)', color: 'oklch(0.48 0.16 264)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
              }}>
                중복확인
              </button>
            </div>
            {nickMsg && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: nickMsg.color }}>{nickMsg.msg}</div>}
          </div>

          <div>
            <label style={labelStyle}>
              비밀번호 변경 <span style={{ color: '#9aa0aa', fontWeight: 400 }}>(변경 시에만 입력)</span>
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호 (4자 이상)" style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          <div style={{ borderTop: '1px solid #eef0f3', paddingTop: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 8 }}>팀</label>
            {me.teamCode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#f8f9fb' }}>
                <span style={{ flex: 'none', width: 8, height: 8, borderRadius: '50%', background: COLOR.primary }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{me.teamName ?? me.teamCode}</span>
                <button className="btn-danger-ghost" onClick={onLeaveTeam} style={{
                  flex: 'none', height: 34, padding: '0 13px', borderRadius: 9, border: '1px solid oklch(0.88 0.05 25)',
                  background: '#fff', color: 'oklch(0.55 0.19 25)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
                }}>
                  팀 나가기
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: '#9aa0aa', padding: '11px 14px', borderRadius: 11, background: '#f8f9fb' }}>
                소속된 팀이 없어요. 팀 메뉴에서 팀 코드로 참여할 수 있어요.
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid #eef0f3', background: '#fafbfc' }}>
          <button className="btn-ghost" onClick={onClose} style={{
            marginLeft: 'auto', height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid #e0e3e8',
            background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            취소
          </button>
          <button className="btn-primary" onClick={save} disabled={busy} style={{
            height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: COLOR.primary, color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', boxShadow: '0 2px 8px oklch(0.54 0.16 264/.3)', opacity: busy ? 0.7 : 1
          }}>
            {busy ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
