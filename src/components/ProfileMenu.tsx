import Avatar from './Avatar'

interface Props {
  nickname: string
  avatar: string | null
  teamName: string | null
  onSettings: () => void
  onJoinTeam: () => void
  onLogout: () => void
  onClose: () => void
}

/** 시안 v2 프로필 드롭다운 */
export default function ProfileMenu({ nickname, avatar, teamName, onSettings, onJoinTeam, onLogout, onClose }: Props) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 44, animation: 'omFade .15s ease' }} />
      <div className="anim-pop" style={{
        position: 'fixed', top: 60, right: 16, width: 230, background: '#fff', borderRadius: 14,
        boxShadow: '0 12px 36px rgba(16,24,40,.2)', border: '1px solid #eef0f3', zIndex: 45, overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 16px', borderBottom: '1px solid #f2f3f5' }}>
          <Avatar name={nickname} avatar={avatar} size={40} fontSize={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nickname}</div>
            {teamName ? (
              <div style={{ fontSize: 11.5, color: '#8a94a6', marginTop: 2 }}>소속 팀: {teamName}</div>
            ) : (
              <button
                onClick={onJoinTeam}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '3px 9px', border: 'none',
                  background: '#eef2ff', borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: '#4f6bed', cursor: 'pointer'
                }}
              >
                소속 팀: 참여하기 →
              </button>
            )}
          </div>
        </div>
        <div style={{ padding: 6 }}>
          <button
            className="menu-item"
            onClick={onSettings}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none',
              background: 'transparent', borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: '#3a3f47', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: 16 }}>{'⚙︎'}</span>설정
          </button>
          <button
            className="menu-item-danger"
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none',
              background: 'transparent', borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: 'oklch(0.55 0.19 25)', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: 16 }}>{'⎋︎'}</span>로그아웃
          </button>
        </div>
      </div>
    </>
  )
}
