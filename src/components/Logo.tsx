import { useId } from 'react'

/** 시안 v4 브랜드 로고 — 그라데이션 라운드 사각 + 꺾은선 차트 */
export default function Logo({ size }: { size: number }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} style={{ flex: 'none', display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6a5cf0" />
          <stop offset="1" stopColor="#9b5fe0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${id})`} />
      <path d="M13 33 L21.5 26 L30 29 L37 15" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="33" r="2.6" fill="#fff" />
      <circle cx="21.5" cy="26" r="2.6" fill="#fff" />
      <circle cx="30" cy="29" r="2.6" fill="#fff" />
      <circle cx="37" cy="15" r="4.4" fill={`url(#${id})`} stroke="#fff" strokeWidth="2.7" />
    </svg>
  )
}
