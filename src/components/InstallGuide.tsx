import { COLOR } from '../config/meta'

/** 네이티브 설치 프롬프트가 불가한 브라우저용 수동 설치 안내 */
function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

const STEPS: Record<'ios' | 'android' | 'desktop', { title: string; steps: string[] }> = {
  ios: {
    title: 'iPhone·iPad에서 설치',
    steps: ['Safari 하단(또는 상단)의 공유 버튼 ⬆️ 을 누르세요.', '목록에서 "홈 화면에 추가"를 선택하세요.', '오른쪽 위 "추가"를 누르면 완료돼요.']
  },
  android: {
    title: 'Android에서 설치',
    steps: ['Chrome 오른쪽 위 메뉴(⋮)를 누르세요.', '"앱 설치" 또는 "홈 화면에 추가"를 선택하세요.', '"설치"를 누르면 완료돼요.']
  },
  desktop: {
    title: '데스크톱에서 설치',
    steps: ['주소창 오른쪽의 설치 아이콘(⊕ 또는 모니터 모양)을 누르세요.', '없으면 브라우저 메뉴(⋮) → "앱 설치 / 페이지를 앱으로 설치".', '"설치"를 누르면 완료돼요.']
  }
}

export default function InstallGuide({ onClose }: { onClose: () => void }) {
  const guide = STEPS[detectPlatform()]
  return (
    <div className="overlay-fade" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(16,24,40,.32)', zIndex: 55,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div className="anim-pop" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 400, background: '#fff', borderRadius: 18,
        boxShadow: '0 24px 60px rgba(16,24,40,.28)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #eef0f3' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{guide.title}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: '#f2f3f5', fontSize: 16, color: '#6b7280', cursor: 'pointer' }}>
            ×
          </button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {guide.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                flex: 'none', width: 24, height: 24, borderRadius: '50%', background: 'oklch(0.96 0.03 264)',
                color: COLOR.primary, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13.5, color: '#3a3f47', lineHeight: 1.55, paddingTop: 2 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #eef0f3', background: '#fafbfc' }}>
          <button className="btn-primary" onClick={onClose} style={{
            width: '100%', height: 42, borderRadius: 10, border: 'none', background: COLOR.primary,
            color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer'
          }}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
