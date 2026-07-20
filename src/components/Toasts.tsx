import type { Toast } from '../store/AppStore'

interface Props {
  toasts: Toast[]
  onUndo: (taskId: string, toastId: string) => void
}

export default function Toasts({ toasts, onUndo }: Props) {
  return (
    <div style={{
      position: 'fixed', right: 18, bottom: 18, zIndex: 60, display: 'flex', flexDirection: 'column',
      gap: 8, alignItems: 'flex-end', pointerEvents: 'none'
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-toast"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, background: '#1a1d21', color: '#fff',
            padding: '12px 14px 12px 16px', borderRadius: 11, boxShadow: '0 8px 24px rgba(16,24,40,.24)',
            fontSize: 13, fontWeight: 500, borderLeft: `3px solid ${t.color}`, maxWidth: 340, pointerEvents: 'auto'
          }}
        >
          <span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: t.color }} />
          <span style={{ flex: 1 }}>{t.msg}</span>
          {t.undoId && (
            <button
              className="toast-undo"
              onClick={() => onUndo(t.undoId!, t.id)}
              style={{
                flex: 'none', height: 28, padding: '0 12px', borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
              }}
            >
              되돌리기
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
