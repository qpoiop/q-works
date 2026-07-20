import type { ViewKey } from '../types'

interface Props {
  view: ViewKey
  color: string
}

const SW = 1.9

/** 시안 v3 하단 네비 아이콘 (24 viewBox, 25px, stroke 1.9) */
export default function NavIcon({ view, color }: Props) {
  const stroke = { fill: 'none', stroke: color, strokeWidth: SW, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  const body = () => {
    switch (view) {
      case 'today':
        return (
          <>
            <circle cx={12} cy={12} r={8.5} fill="none" stroke={color} strokeWidth={SW} />
            <path d="M8.4 12.4l2.5 2.5 4.6-5.1" {...stroke} />
          </>
        )
      case 'mytasks':
        return (
          <>
            <path d="M9 6h11" {...stroke} />
            <path d="M9 12h11" {...stroke} />
            <path d="M9 18h11" {...stroke} />
            <circle cx={4} cy={6} r={1.5} fill={color} stroke={color} strokeWidth={SW} />
            <circle cx={4} cy={12} r={1.5} fill={color} stroke={color} strokeWidth={SW} />
            <circle cx={4} cy={18} r={1.5} fill={color} stroke={color} strokeWidth={SW} />
          </>
        )
      case 'timeline':
        return (
          <>
            <path d="M6 3v18" {...stroke} />
            <circle cx={6} cy={8} r={2.4} fill="#fff" stroke={color} strokeWidth={SW} />
            <circle cx={6} cy={16} r={2.4} fill="#fff" stroke={color} strokeWidth={SW} />
            <path d="M11 8h8" {...stroke} />
            <path d="M11 16h6" {...stroke} />
          </>
        )
      case 'milestone':
        return (
          <>
            <path d="M6 21V4" {...stroke} />
            <path d="M6 4.5h11l-2.6 3.4L17 11.5H6" {...stroke} />
          </>
        )
      case 'calendar':
        return (
          <>
            <rect x={3.5} y={5} width={17} height={15.5} rx={3} fill="none" stroke={color} strokeWidth={SW} />
            <path d="M3.5 10h17" {...stroke} />
            <path d="M8 3v4" {...stroke} />
            <path d="M16 3v4" {...stroke} />
          </>
        )
      case 'team':
        return (
          <>
            <circle cx={8.5} cy={8} r={3} fill="none" stroke={color} strokeWidth={SW} />
            <path d="M3 20a5.5 5.5 0 0 1 11 0" {...stroke} />
            <circle cx={17} cy={9} r={2.3} fill="none" stroke={color} strokeWidth={SW} />
            <path d="M16.2 14.6c2.4.1 4.3 2 4.3 4.4" {...stroke} />
          </>
        )
    }
  }
  return (
    <svg width={25} height={25} viewBox="0 0 24 24" aria-hidden="true">
      {body()}
    </svg>
  )
}
