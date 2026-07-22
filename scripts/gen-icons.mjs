// v5 로고(favicon.svg 동일 모티프)를 풀블리드 PNG 홈 아이콘으로 생성
// 투명 라운드 코너 제거 → iOS/Android가 자체 마스킹. 그라디언트가 정사각 꽉 채움.
import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5b9df9"/><stop offset="1" stop-color="#2f5fe6"/></linearGradient></defs>
  <rect x="0" y="0" width="48" height="48" fill="url(#g)"/>
  <g transform="translate(24 24) scale(0.66) translate(-24 -24)">
    <path d="M13 33 L21.5 26 L30 29 L37 15" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="13" cy="33" r="2.7" fill="#fff"/>
    <circle cx="21.5" cy="26" r="2.7" fill="#fff"/>
    <circle cx="30" cy="29" r="2.7" fill="#fff"/>
    <circle cx="37" cy="15" r="4.6" fill="url(#g)" stroke="#fff" stroke-width="2.9"/>
  </g>
</svg>`

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icon-${size}.png`)
  console.log(`public/icon-${size}.png`)
}
