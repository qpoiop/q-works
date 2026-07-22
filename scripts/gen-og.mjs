import sharp from 'sharp'
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5b8def"/><stop offset="1" stop-color="#3055d8"/></linearGradient>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5b9df9"/><stop offset="1" stop-color="#2f5fe6"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(600 215)">
    <rect x="-64" y="-64" width="128" height="128" rx="30" fill="#fff"/>
    <g transform="scale(1.7) translate(-24 -24)">
      <path d="M13 33 L21.5 26 L30 29 L37 15" fill="none" stroke="url(#lg)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="13" cy="33" r="2.7" fill="url(#lg)"/><circle cx="21.5" cy="26" r="2.7" fill="url(#lg)"/>
      <circle cx="30" cy="29" r="2.7" fill="url(#lg)"/><circle cx="37" cy="15" r="4.6" fill="#fff" stroke="url(#lg)" stroke-width="2.9"/>
    </g>
  </g>
  <text x="600" y="380" text-anchor="middle" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, sans-serif" font-size="84" font-weight="800" fill="#fff">업무 관리</text>
  <text x="600" y="450" text-anchor="middle" font-family="Apple SD Gothic Neo, Noto Sans CJK KR, sans-serif" font-size="34" font-weight="500" fill="#dbe6ff">할 일 · 마일스톤 · 팀 타임라인, 한 곳에서</text>
</svg>`
await sharp(Buffer.from(svg)).png().toFile('public/og-image.png')
console.log('public/og-image.png')
