import { COLOR } from '../config/meta'

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="anim-fade" style={{
      background: '#fff', border: '1px solid #eceef1', borderRadius: 16, padding: '40px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center'
    }}>
      <span style={{
        width: 44, height: 44, borderRadius: '50%', background: 'oklch(0.95 0.04 25)', color: 'oklch(0.55 0.19 25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20
      }}>
        !
      </span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>데이터를 불러오지 못했어요</div>
        <div style={{ fontSize: 12.5, color: '#8a94a6', marginTop: 4 }}>{message}</div>
      </div>
      <button
        className="btn-primary"
        onClick={onRetry}
        style={{
          height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: COLOR.primary,
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px oklch(0.54 0.16 264/.3)'
        }}
      >
        다시 시도
      </button>
    </div>
  )
}
