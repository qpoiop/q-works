import type { CSSProperties } from 'react'

/** 시안의 노데이터 스타일 (dashed 카드) */
export default function EmptyState({ message, style }: { message: string; style?: CSSProperties }) {
  return (
    <div style={{
      padding: 22, textAlign: 'center', color: '#9aa0aa', fontSize: 13,
      background: '#fff', border: '1px dashed #dfe3e8', borderRadius: 14, ...style
    }}>
      {message}
    </div>
  )
}
