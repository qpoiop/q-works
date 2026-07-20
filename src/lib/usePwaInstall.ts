import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const SNOOZE_KEY = 'installBannerSnoozeUntil' // × 닫기 → 이 시각까지 숨김
const INSTALLED_KEY = 'installBannerDone' // 실제 설치 완료 → 영구 숨김
const SNOOZE_DAYS = 7

function shouldShow(): boolean {
  if (localStorage.getItem(INSTALLED_KEY) === '1') return false
  const until = Number(localStorage.getItem(SNOOZE_KEY) ?? '0')
  return Date.now() >= until
}

export function usePwaInstall() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
  const [bannerOpen, setBannerOpen] = useState(() => !isStandalone && shouldShow())

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)
    // 설치 완료 감지 → 영구 숨김
    const installed = () => {
      localStorage.setItem(INSTALLED_KEY, '1')
      setBannerOpen(false)
    }
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  /** × 닫기 — 7일 스누즈 (영구 숨김 아님) */
  const dismiss = useCallback(() => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400_000))
    setBannerOpen(false)
  }, [])

  /** 설치 시도. 네이티브 프롬프트 불가 시 안내 필요 여부(false) 반환 */
  const install = useCallback(async (): Promise<boolean> => {
    const evt = deferredRef.current
    if (evt) {
      await evt.prompt()
      const choice = await evt.userChoice.catch(() => ({ outcome: 'dismissed' as const }))
      deferredRef.current = null
      if (choice.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1')
      } else {
        localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400_000))
      }
      setBannerOpen(false)
      return true
    }
    // 네이티브 프롬프트 없음(이미 설치됐거나 미지원/브라우저 조건 미충족) → 수동 안내
    dismiss()
    return false
  }, [dismiss])

  return { bannerOpen, install, dismiss }
}
