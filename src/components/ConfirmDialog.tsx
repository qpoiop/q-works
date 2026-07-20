interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 시안 모달 룩앤필을 따르는 확인 다이얼로그 (삭제 등 되돌릴 수 없는 동작용) */
export default function ConfirmDialog({
  title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false, onConfirm, onCancel
}: Props) {
  const accent = danger ? 'oklch(0.6 0.19 25)' : 'oklch(0.54 0.16 264)'
  return (
    <div className="overlay-fade" onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(16,24,40,.32)', zIndex: 55,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div className="anim-pop" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18,
        boxShadow: '0 24px 60px rgba(16,24,40,.28)', overflow: 'hidden'
      }}>
        <div style={{ padding: '22px 22px 18px' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 8, lineHeight: 1.55 }}>{message}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid #eef0f3', background: '#fafbfc' }}>
          <button
            className="btn-ghost"
            onClick={onCancel}
            style={{
              height: 38, padding: '0 16px', borderRadius: 10, border: '1px solid #e0e3e8',
              background: '#fff', color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: accent,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 2px 8px ${danger ? 'oklch(0.6 0.19 25/.3)' : 'oklch(0.54 0.16 264/.3)'}`
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
