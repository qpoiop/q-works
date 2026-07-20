// 과금 방어 + 보안: 레이트리밋, 오리진 검증, 요청 크기 제한, 보안 헤더

/** Cloudflare Rate Limiting 바인딩 (있으면 사용, 없으면 인메모리 폴백) */
export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

const WINDOW_MS = 60_000
export const READ_LIMIT_PER_MIN = 120
export const WRITE_LIMIT_PER_MIN = 30

/** 아이솔레이트 로컬 슬라이딩 윈도우 (바인딩 미지원 환경 폴백) */
class MemoryLimiter {
  private buckets = new Map<string, { count: number; start: number }>()
  constructor(private max: number) {}

  allow(key: string): boolean {
    const now = Date.now()
    const b = this.buckets.get(key)
    if (!b || now - b.start >= WINDOW_MS) {
      this.buckets.set(key, { count: 1, start: now })
      // 메모리 상한: 오래된 버킷 정리
      if (this.buckets.size > 10_000) {
        for (const [k, v] of this.buckets) {
          if (now - v.start >= WINDOW_MS) this.buckets.delete(k)
        }
      }
      return true
    }
    b.count++
    return b.count <= this.max
  }
}

const memRead = new MemoryLimiter(READ_LIMIT_PER_MIN)
const memWrite = new MemoryLimiter(WRITE_LIMIT_PER_MIN)

export async function checkRateLimit(
  request: Request,
  isWrite: boolean,
  binding?: RateLimiterBinding
): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  // 인메모리(아이솔레이트 단위)는 항상 검사 — 바인딩은 콜로 단위 보강 (근사 집계라 단독 의존 금지)
  const memOk = (isWrite ? memWrite : memRead).allow(ip)
  if (!memOk) return false
  if (binding) {
    try {
      const { success } = await binding.limit({ key: ip })
      return success
    } catch {
      /* 바인딩 오류는 무시 — 인메모리 결과 사용 */
    }
  }
  return true
}

/** 변형 요청(CSRF·크로스사이트 봇) 차단: Origin·Sec-Fetch-Site 검증 */
export function isCrossSiteMutation(request: Request): boolean {
  const url = new URL(request.url)
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== url.host) return true
    } catch {
      return true
    }
  }
  const site = request.headers.get('sec-fetch-site')
  if (site && site === 'cross-site') return true
  return false
}

export const MAX_BODY_BYTES = 16 * 1024

export function bodyTooLarge(request: Request): boolean {
  const len = Number(request.headers.get('content-length') ?? '0')
  return len > MAX_BODY_BYTES
}

/** 입력 필드 길이 상한 (저장 비용·오용 방지) */
export const FIELD_LIMITS = {
  title: 200,
  content: 4000,
  assignee: 50,
  tagCount: 10,
  tagLength: 30,
  desc: 300,
  id: 64
} as const

/** 저장 행 수 상한 */
export const MAX_TASKS = 2000
export const MAX_NOTIFICATIONS = 200

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "font-src https://cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self'; " +
    "manifest-src 'self'; worker-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
}

export function withSecurityHeaders(res: Response, isApi: boolean): Response {
  const out = new Response(res.body, res)
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v)
  if (isApi) out.headers.set('cache-control', 'no-store')
  return out
}
