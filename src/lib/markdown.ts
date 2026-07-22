import { marked } from 'marked'
import DOMPurify from 'dompurify'

// GFM + 줄바꿈 유지. 비동기 확장 없음 → parse는 동기 문자열 반환
marked.setOptions({ gfm: true, breaks: true })

/**
 * 마크다운 소스 → 살균된 HTML.
 * HTML 입력 모드는 없지만 소스에 raw HTML이 섞여도 DOMPurify가 script·on*·iframe 등 제거.
 */
export function renderMarkdown(src: string): string {
  const raw = marked.parse(src ?? '', { async: false }) as string
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    // 링크는 새 탭 + noopener 강제(아래 훅)로 안전화
    ADD_ATTR: ['target', 'rel']
  })
}

/** 카드 스니펫용 — 마크다운 마커 제거한 1줄 평문 근사 */
export function mdToPlain(src: string): string {
  return (src ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// 외부 링크 새 탭·noopener (탭내빙 방지)
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})
