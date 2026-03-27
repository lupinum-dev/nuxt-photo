declare module '#app' {
  import type { App } from 'vue'

  export type NuxtApp = {
    vueApp: App
  }

  export function defineNuxtPlugin<T>(plugin: T): T
  export function useAppConfig(): Record<string, unknown>
}

declare module '#imports' {
  type ImageSizesResult = {
    src: string
    srcset?: string
    sizes?: string
  }

  type UseImage = ((src: string, modifiers?: Record<string, unknown>) => string) & {
    getSizes(src: string, modifiers?: Record<string, unknown>): ImageSizesResult
  }

  export function useImage(): UseImage
}
