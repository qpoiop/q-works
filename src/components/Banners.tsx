import { COLOR } from '../config/meta'

export function InstallBanner({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14,
      background: 'linear-gradient(100deg,oklch(0.54 0.16 264),oklch(0.55 0.16 290))', color: '#fff',
      marginBottom: 14, boxShadow: '0 6px 20px oklch(0.54 0.16 264/.28)'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>홈 화면에 설치하기</div>
        <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>앱처럼 바로 열고, 마감·알림을 놓치지 마세요.</div>
      </div>
      <button
        onClick={onInstall}
        style={{
          flex: 'none', height: 34, padding: '0 14px', borderRadius: 9, border: 'none', background: '#fff',
          color: 'oklch(0.5 0.16 264)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
        }}
      >
        설치
      </button>
      <button
        onClick={onDismiss}
        style={{
          flex: 'none', width: 30, height: 30, borderRadius: 8, border: 'none',
          background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 15, cursor: 'pointer'
        }}
      >
        ×
      </button>
    </div>
  )
}

export function NotifPermissionBanner({ onEnable }: { onEnable: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderRadius: 14,
      background: '#fff', border: '1px solid #e8eaed', marginBottom: 14
    }}>
      <span style={{
        flex: 'none', width: 34, height: 34, borderRadius: '50%', background: 'oklch(0.96 0.05 75)',
        color: 'oklch(0.5 0.14 65)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
      }}>
        !
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>브라우저 알림을 켜세요</div>
        <div style={{ fontSize: 12, color: '#8a94a6', marginTop: 1 }}>마감 임박·업무 업데이트를 실시간으로 알려드려요.</div>
      </div>
      <button
        onClick={onEnable}
        style={{
          flex: 'none', height: 34, padding: '0 14px', borderRadius: 9,
          border: `1px solid ${COLOR.primary}`, background: 'oklch(0.96 0.03 264)',
          color: 'oklch(0.48 0.16 264)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
        }}
      >
        알림 켜기
      </button>
    </div>
  )
}
