import { NAV_ITEMS } from '../config/meta'
import type { ViewKey } from '../types'
import NavIcon from './NavIcon'

interface Props {
  view: ViewKey
  onNavigate: (v: ViewKey) => void
  badgeCount: number // '오늘' 탭 배지 — 오늘·지연 마감 수
}

/** 시안 v3 하단 네비: 블러 배경 + safe-area, 아이콘 필(pill) + 배지 */
export default function MobileNav({ view, onNavigate, badgeCount }: Props) {
  return (
    <nav
      aria-label="주 메뉴"
      style={{
        flex: 'none', display: 'flex', justifyContent: 'center',
        background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #edeff2', padding: '8px 10px calc(10px + env(safe-area-inset-bottom))'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', maxWidth: 620 }}>
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          const badge = item.key === 'today' ? badgeCount : 0
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '3px 2px', border: 'none', background: 'transparent', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', maxWidth: 64, height: 32, borderRadius: 12,
                background: active ? 'oklch(0.95 0.04 264)' : 'transparent', transition: 'background .15s'
              }}>
                <NavIcon view={item.key} color={active ? 'oklch(0.5 0.17 264)' : '#98a0ac'} />
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -3, right: 8, minWidth: 16, height: 16, padding: '0 3px',
                    borderRadius: 8, background: 'oklch(0.6 0.19 25)', color: '#fff',
                    fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #fff'
                  }}>
                    {badge}
                  </span>
                )}
              </span>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? 'oklch(0.46 0.17 264)' : '#8a94a6',
                whiteSpace: 'nowrap', letterSpacing: '-.4px'
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
