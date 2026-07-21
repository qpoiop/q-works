// README용 스크린샷 캡처 — 로컬 서버(wrangler dev, :8787) 실행 중일 때:
//   node scripts/screenshots.mjs
// Chrome 실행 파일 경로는 CHROME_PATH 환경변수로 덮어쓸 수 있음.
import puppeteer from 'puppeteer-core'

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.BASE_URL || 'http://localhost:8787'
const OUT = 'docs/screenshots'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n) }
const nav = async (label) => {
  await page.evaluate((l) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === l); b && b.click() }, label)
  await sleep(800)
}

await page.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(700)
await shot('00-login')
await page.type('input[placeholder="닉네임"]', '김하늘')
await page.type('input[type="password"]', '1234')
await page.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '로그인' && x.offsetWidth > 300).click() })
await page.waitForFunction(() => document.body.innerText.includes('오늘 할 일') || document.body.innerText.includes('마감인 내 업무'), { timeout: 8000 })
await sleep(900); await shot('01-today')
await nav('타임라인'); await sleep(600); await shot('02-timeline')
await nav('마일스톤'); await sleep(600); await shot('03-milestone')
await nav('캘린더'); await sleep(600); await shot('04-calendar')
await page.evaluate(() => { const c = [...document.querySelectorAll('div')].find((d) => d.textContent === '3분기 마케팅 캠페인 기획안' && d.offsetHeight < 30); c && c.click() })
await sleep(700); await shot('05-calendar-daylayer')
await page.evaluate(() => { const o = document.querySelector('.overlay-fade'); o && o.click() }); await sleep(400)
await nav('팀'); await sleep(600); await shot('06-team')
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await nav('오늘'); await sleep(700); await shot('07-mobile-today')
await browser.close(); console.log('done')
