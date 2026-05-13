declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    query_id?: string
  }
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  MainButton: {
    text: string
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
    offClick: (fn: () => void) => void
    showProgress: (leaveActive: boolean) => void
    hideProgress: () => void
    enable: () => void
    disable: () => void
    isVisible: boolean
    isActive: boolean
  }
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
    offClick: (fn: () => void) => void
    isVisible: boolean
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  enableClosingConfirmation: () => void
  sendData: (data: string) => void
}

export const tg = window.Telegram?.WebApp

export function initTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user ?? null
}

export function getTelegramInitData() {
  return tg?.initData ?? ''
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  tg?.HapticFeedback?.impactOccurred(type)
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred('success')
}

export function hapticError() {
  tg?.HapticFeedback?.notificationOccurred('error')
}

export const isDev = import.meta.env.DEV && !window.Telegram?.WebApp
