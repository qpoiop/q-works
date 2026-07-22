import Logo from './Logo'

/** 초기 부트스트랩(세션 판별) 동안 표시하는 로고 스플래시 */
export default function SplashScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90, background: '#eef0f3',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
    }}>
      <div className="splash-logo">
        <Logo size={64} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.2px', color: '#1a1d21' }}>업무 관리</div>
      <div className="splash-dots" aria-label="로딩 중">
        <span /><span /><span />
      </div>
    </div>
  )
}
