import type { CSSProperties } from 'react'
import { memberMeta } from '../config/meta'

interface Props {
  name: string
  avatar?: string | null
  size: number
  fontSize?: number
  style?: CSSProperties
}

/** 아바타: 업로드 이미지 우선, 없으면 멤버 색 + 약칭 */
export default function Avatar({ name, avatar, size, fontSize, style }: Props) {
  const meta = memberMeta(name)
  return (
    <span style={{
      flex: 'none', width: size, height: size, borderRadius: '50%',
      background: avatar ? `center/cover url(${avatar})` : meta.color,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: fontSize ?? Math.round(size * 0.36), ...style
    }}>
      {avatar ? '' : meta.short}
    </span>
  )
}
