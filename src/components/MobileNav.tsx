import { COLOR, NAV_ITEMS } from '../config/meta'
import type { ViewKey } from '../types'

interface Props {
  view: ViewKey
  onNavigate: (v: ViewKey) => void
}

export default function MobileNav({ view, onNavigate }: Props) {
  return (
    <nav style={{ flex: 'none', display: 'flex', background: '#fff', borderTop: '1px solid #e8eaed', padding: '4px 2px 6px', overflowX: 'auto' }}>
      {NAV_ITEMS.map((item) => {
        const active = view === item.key
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              flex: '1 0 auto', minWidth: 62, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 4px', border: 'none', background: 'transparent',
              fontSize: 11, fontWeight: active ? 700 : 500,
              color: active ? 'oklch(0.46 0.17 264)' : '#9aa0aa', cursor: 'pointer'
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? COLOR.primary : 'transparent' }} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
