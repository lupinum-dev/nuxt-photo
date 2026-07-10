import type { DebugFlags } from './core/debug/logger'

declare global {
  interface Window {
    __NUXT_PHOTO_DEBUG__?: DebugFlags
  }

  interface ImportMeta {
    env: {
      DEV?: boolean
      [key: string]: unknown
    }
  }
}

export {}
