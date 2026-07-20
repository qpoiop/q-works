import { useState } from 'react'
import type { CSSProperties } from 'react'
import { COLOR, DEMO_TEAM_CODES } from '../config/meta'
import { useStore } from '../store/AppStore'

const inputStyle: CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', border: '1px solid #e0e3e8', borderRadius: 11, fontSize: 14, background: '#fff'
}
const labelStyle: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#4b5563', marginBottom: 6 }

function tabStyle(active: boolean): CSSProperties {
  return {
    flex: 1, padding: '11px 0', fontSize: 13.5, fontWeight: 700, border: 'none', borderRadius: 10,
    cursor: 'pointer', transition: 'all .12s',
    background: active ? '#fff' : 'transparent',
    color: active ? 'oklch(0.44 0.17 264)' : '#8a94a6',
    boxShadow: active ? '0 1px 3px rgba(16,24,40,.12)' : 'none'
  }
}

/** 시안 v2 로그인/회원가입 화면 */
export default function AuthPage() {
  const store = useStore()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const switchTab = (t: 'login' | 'signup') => {
    setTab(t)
    setErr('')
  }

  const submit = async () => {
    if (busy) return
    if (tab === 'login' && (!nickname.trim() || !password)) {
      setErr('닉네임과 비밀번호를 입력하세요.')
      return
    }
    setBusy(true)
    const e = tab === 'login' ? await store.login(nickname, password) : await store.signup(nickname, password, teamCode)
    setBusy(false)
    if (e) setErr(e)
  }

  const primaryBtn: CSSProperties = {
    height: 46, borderRadius: 12, border: 'none', background: COLOR.primary, color: '#fff',
    fontSize: 14.5, fontWeight: 700, cursor: 'pointer', marginTop: 2,
    boxShadow: '0 4px 12px oklch(0.54 0.16 264/.35)', opacity: busy ? 0.7 : 1
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80, overflowY: 'auto',
      background: 'radial-gradient(120% 100% at 50% 0%,oklch(0.55 0.14 275) 0%,oklch(0.42 0.13 285) 60%,oklch(0.34 0.1 290) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22
    }}>
      <div className="anim-pop" style={{
        width: '100%', maxWidth: 420, background: '#fff', borderRadius: 22,
        boxShadow: '0 30px 70px rgba(16,24,40,.4)', padding: '30px 28px', margin: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 11, background: COLOR.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18
          }}>
            T
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.4px' }}>팀 작업 관리</div>
            <div style={{ fontSize: 12, color: '#8a94a6' }}>할 일 · 마일스톤 · 팀 타임라인</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#f2f3f5', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <button onClick={() => switchTab('login')} style={tabStyle(tab === 'login')}>로그인</button>
          <button onClick={() => switchTab('signup')} style={tabStyle(tab === 'signup')}>회원가입</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label style={labelStyle}>닉네임</label>
            <input value={nickname} onChange={(e) => { setNickname(e.target.value); setErr('') }} placeholder="닉네임" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>비밀번호</label>
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="비밀번호" style={inputStyle}
            />
          </div>
          {tab === 'signup' && (
            <div>
              <label style={labelStyle}>
                팀 코드 <span style={{ color: '#9aa0aa', fontWeight: 400 }}>(선택 · 비우면 무소속)</span>
              </label>
              <input
                value={teamCode} onChange={(e) => { setTeamCode(e.target.value); setErr('') }}
                placeholder="예: PROD2026" style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </div>
          )}
          {err && (
            <div style={{
              fontSize: 12.5, color: 'oklch(0.55 0.19 25)', background: 'oklch(0.96 0.03 25)',
              border: '1px solid oklch(0.9 0.05 25)', padding: '9px 12px', borderRadius: 10
            }}>
              {err}
            </div>
          )}
          <button className="btn-primary" onClick={submit} style={primaryBtn}>
            {tab === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>

        <div style={{ marginTop: 18, padding: '12px 14px', background: '#f8f9fb', borderRadius: 11, fontSize: 11.5, color: '#8a94a6', lineHeight: 1.6 }}>
          체험 계정 — 닉네임 <b style={{ color: '#4b5563' }}>테스터</b> · 비밀번호 <b style={{ color: '#4b5563' }}>1234</b> (팀 PROD2026)
          <br />팀 코드: {DEMO_TEAM_CODES}
        </div>
      </div>
    </div>
  )
}
