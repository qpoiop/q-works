import type { AppNotification } from '../types'
import { NOTIF_TYPE_META } from '../config/meta'
import { relTime } from '../lib/date'

interface Props {
  notifications: AppNotification[]
  onClose: () => void
  onTest: () => void
  onOpenNotification: (n: AppNotification) => void
}

export default function NotificationPanel({ notifications, onClose, onTest, onOpenNotification }: Props) {
  return (
    <>
      <div className="overlay-fade" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,.28)', zIndex: 40 }} />
      <div className="anim-slide" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(400px,92vw)', background: '#fff', zIndex: 41,
        display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 30px rgba(16,24,40,.16)'
      }}>
        <div style={{
          flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid #eef0f3'
        }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>알림</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-ghost"
              onClick={onTest}
              style={{
                height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #e0e3e8', background: '#fff',
                fontSize: 12, fontWeight: 600, color: '#4b5563', cursor: 'pointer'
              }}
            >
              테스트 알림
            </button>
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f2f3f5', fontSize: 15, color: '#6b7280', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {notifications.length === 0 && (
            <div style={{ padding: '38px 20px', textAlign: 'center', color: '#9aa0aa', fontSize: 13 }}>
              아직 도착한 알림이 없어요.
            </div>
          )}
          {notifications.map((n) => {
            const meta = NOTIF_TYPE_META[n.type] ?? NOTIF_TYPE_META['업데이트']
            return (
              <div
                key={n.id}
                className="notif-row"
                onClick={() => onOpenNotification(n)}
                style={{
                  display: 'flex', gap: 11, padding: '12px 12px', borderRadius: 12, cursor: 'pointer',
                  background: n.read ? 'transparent' : 'oklch(0.98 0.015 264)'
                }}
              >
                <span style={{ flex: 'none', width: 8, height: 8, borderRadius: '50%', background: meta.color, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#9aa0aa', marginLeft: 'auto' }}>{relTime(n.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.taskTitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{n.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
