import { COLOR, NAV_ITEMS } from '../config/meta'
import type { Me, ViewKey } from '../types'
import Avatar from './Avatar'
import Logo from './Logo'

interface Props {
  view: ViewKey
  onNavigate: (v: ViewKey) => void
  badgeCount: number // '오늘' 탭 배지 — 오늘·지연 마감 수
  me: Me | null
  onProfile: () => void
}

export default function Sidebar({ view, onNavigate, badgeCount, me, onProfile }: Props) {
  return (
    <aside style={{
      flex: 'none', width: 240, background: '#fff', borderRight: '1px solid #e8eaed',
      display: 'flex', flexDirection: 'column', padding: '20px 14px 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px' }}>
        <Logo size={30} />
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.2px' }}>팀 작업 관리</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          const badge = item.key === 'today' ? badgeCount : 0
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: active ? 700 : 500,
                cursor: 'pointer', transition: 'all .12s',
                background: active ? 'oklch(0.96 0.03 264)' : 'transparent',
                color: active ? 'oklch(0.44 0.17 264)' : '#5b6472'
              }}
            >
              <span style={{ flex: 'none', width: 6, height: 6, borderRadius: '50%', background: active ? COLOR.primary : 'transparent' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  flex: 'none', fontSize: 11, fontWeight: 700, minWidth: 19, height: 19, padding: '0 5px',
                  borderRadius: 10, background: 'oklch(0.6 0.19 25)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <button
        className="profile-btn"
        onClick={onProfile}
        style={{
          marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px',
          borderTop: '1px solid #eef0f3', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
          background: 'transparent', cursor: 'pointer', textAlign: 'left', borderRadius: 0
        }}
      >
        <Avatar name={me?.nickname ?? ''} avatar={me?.avatar} size={34} fontSize={12} />
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me?.nickname ?? ''}</div>
          <div style={{ fontSize: 11, color: '#8a94a6' }}>{me?.teamName ?? '무소속'}</div>
        </div>
        <span style={{ flex: 'none', color: '#c2c8d2', fontSize: 15 }}>⋯</span>
      </button>
    </aside>
  )
}
