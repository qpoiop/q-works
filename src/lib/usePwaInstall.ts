import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'installBannerDismissed'

export function usePwaInstall() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
  const [bannerOpen, setBannerOpen] = useState(() => !isStandalone && localStorage.getItem(DISMISS_KEY) !== '1')

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1')
    setBannerOpen(false)
  }, [])

  /** 설치 시도. 네이티브 프롬프트 불가 시 안내 필요 여부(false) 반환 */
  const install = useCallback(async (): Promise<boolean> => {
    const evt = deferredRef.current
    if (evt) {
      await evt.prompt()
      await evt.userChoice.finally(() => {})
      setBannerOpen(false)
      localStorage.setItem(DISMISS_KEY, '1')
      return true
    }
    dismiss()
    return false
  }, [dismiss])

  return { bannerOpen, install, dismiss }
}
