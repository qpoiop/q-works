import { COLOR, memberMeta } from '../config/meta'
import type { Me } from '../types'

interface Props {
  title: string
  subtitle: string
  unreadCount: number
  onBell: () => void
  onNew: () => void
  isMobile: boolean
  me: Me | null
  onProfile: () => void
}

export default function Header({ title, subtitle, unreadCount, onBell, onNew, isMobile, me, onProfile }: Props) {
  const meta = memberMeta(me?.nickname ?? '')
  return (
    <header style={{
      flex: 'none', display: 'flex', alignItems: 'center', gap: 12,
      // iOS standalone: 노치/다이나믹아일랜드·landscape 노치 안전영역 확보
      padding: 'calc(15px + env(safe-area-inset-top)) calc(22px + env(safe-area-inset-right)) 15px calc(22px + env(safe-area-inset-left))',
      background: '#fff', borderBottom: '1px solid #e8eaed', zIndex: 2
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.3px' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: '#8a94a6', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </div>
      </div>
      {isMobile && (
        <button
          onClick={onProfile}
          title="내 프로필"
          style={{
            flex: 'none', width: 38, height: 38, borderRadius: '50%', border: '1px solid #e0e3e8',
            background: me?.avatar ? `center/cover url(${me.avatar})` : meta.color,
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0
          }}
        >
          {me?.avatar ? '' : meta.short}
        </button>
      )}
      <button
        className="btn-ghost"
        onClick={onBell}
        title="알림"
        style={{
          position: 'relative', flex: 'none', height: 38, padding: '0 14px', borderRadius: 10,
          border: '1px solid #e0e3e8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#4b5563', cursor: 'pointer'
        }}
      >
        알림
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, minWidth: 19, height: 19, padding: '0 5px',
            borderRadius: 10, background: 'oklch(0.6 0.19 25)', color: '#fff', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>
      <button
        className="btn-primary"
        onClick={onNew}
        style={{
          flex: 'none', height: 38, padding: '0 16px', borderRadius: 10, border: 'none',
          background: COLOR.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 8px oklch(0.54 0.16 264/.3)'
        }}
      >
        + 새 업무
      </button>
    </header>
  )
}
