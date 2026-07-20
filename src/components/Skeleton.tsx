/** 로딩 중 카드 스켈레톤 */
export default function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #eceef1', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 14, width: '55%' }} />
            <div className="skeleton" style={{ height: 11, width: '80%' }} />
            <div className="skeleton" style={{ height: 11, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
