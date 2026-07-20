import { useState } from 'react'
import { COLOR, DEMO_TEAM_CODES } from '../config/meta'
import { useStore } from '../store/AppStore'

interface Props {
  title: string
  description: string
  showDemoCodes?: boolean
}

/** 시안 v2 팀 참여 카드 (팀 뷰·마일스톤 뷰의 무소속 상태) */
export default function TeamJoinCard({ title, description, showDemoCodes = false }: Props) {
  const store = useStore()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const join = async () => {
    if (busy) return
    const v = code.trim().toUpperCase()
    if (!v) {
      setErr('팀 코드를 입력하세요.')
      return
    }
    setBusy(true)
    try {
      const e = await store.joinTeam(v)
      if (e) setErr(e)
      else setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      maxWidth: 420, margin: '40px auto', textAlign: 'center', background: '#fff',
      border: '1px solid #eceef1', borderRadius: 18, padding: '34px 28px'
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 15, background: 'oklch(0.96 0.03 264)', color: 'oklch(0.5 0.16 264)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, margin: '0 auto 16px'
      }}>
        ＃
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#8a94a6', lineHeight: 1.6, marginBottom: 20 }}>{description}</div>
      <input
        value={code}
        onChange={(e) => { setCode(e.target.value); setErr('') }}
        onKeyDown={(e) => { if (e.key === 'Enter') join() }}
        placeholder="팀 코드 입력 (예: PROD2026)"
        style={{
          width: '100%', height: 46, padding: '0 15px', border: '1px solid #e0e3e8', borderRadius: 12,
          fontSize: 14, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10
        }}
      />
      {err && <div style={{ fontSize: 12.5, color: 'oklch(0.55 0.19 25)', marginBottom: 10 }}>{err}</div>}
      <button className="btn-primary" onClick={join} disabled={busy} style={{
        width: '100%', height: 46, borderRadius: 12, border: 'none', background: COLOR.primary,
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1
      }}>
        {busy ? '참여 중…' : '팀 참여하기'}
      </button>
      {showDemoCodes && <div style={{ fontSize: 11.5, color: '#b0b6c0', marginTop: 14 }}>체험용 팀 코드: {DEMO_TEAM_CODES}</div>}
    </div>
  )
}
