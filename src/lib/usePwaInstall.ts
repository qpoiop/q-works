import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null
  }
}

const SNOOZE_KEY = 'installBannerSnoozeUntil' // × 닫기 → 이 시각까지 숨김
const INSTALLED_KEY = 'installBannerDone' // 실제 설치 완료 → 영구 숨김
const SNOOZE_DAYS = 7

export type InstallResult = 'installed' | 'dismissed' | 'manual' // manual = 네이티브 프롬프트 불가 → 수동 안내

function shouldShow(): boolean {
  if (localStorage.getItem(INSTALLED_KEY) === '1') return false
  const until = Number(localStorage.getItem(SNOOZE_KEY) ?? '0')
  return Date.now() >= until
}

export function usePwaInstall() {
  // index.html에서 조기 캡처한 프롬프트 우선 사용
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__deferredInstallPrompt ?? null : null
  )
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
  const [bannerOpen, setBannerOpen] = useState(() => !isStandalone && shouldShow())

  useEffect(() => {
    const capture = () => {
      deferredRef.current = window.__deferredInstallPrompt ?? null
    }
    // 조기 캡처 이후 발화분도 반영
    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('pwa-installable', capture)
    const installed = () => {
      localStorage.setItem(INSTALLED_KEY, '1')
      deferredRef.current = null
      setBannerOpen(false)
    }
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('pwa-installable', capture)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  /** × 닫기 — 7일 스누즈 (영구 숨김 아님) */
  const dismiss = useCallback(() => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400_000))
    setBannerOpen(false)
  }, [])

  /** 설치 시도. 결과: installed(설치됨) / dismissed(거부) / manual(네이티브 불가 → 수동 안내 필요) */
  const install = useCallback(async (): Promise<InstallResult> => {
    const evt = deferredRef.current ?? window.__deferredInstallPrompt ?? null
    if (evt) {
      await evt.prompt()
      const choice = await evt.userChoice.catch(() => ({ outcome: 'dismissed' as const }))
      deferredRef.current = null
      window.__deferredInstallPrompt = null
      if (choice.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1')
        setBannerOpen(false)
        return 'installed'
      }
      // 거부 — 배너는 유지(다음에 다시 시도 가능)
      return 'dismissed'
    }
    // 네이티브 프롬프트 없음(iOS/미지원/조건 미충족) → 수동 안내, 배너 유지
    return 'manual'
  }, [])

  return { bannerOpen, install, dismiss }
}
