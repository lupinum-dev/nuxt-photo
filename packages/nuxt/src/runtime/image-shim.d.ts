// Minimal type shim for @nuxt/image's virtual '#image' module.
// Only used for local TypeScript checking in the nuxt package build.
// The real module is provided by @nuxt/image at runtime in the consumer's app.
declare module '#image' {
  interface ImageHelper {
    (src: string, options?: Record<string, unknown>): string
    getSizes(src: string, options?: {
      sizes?: string
      modifiers?: Record<string, unknown>
    }): { src: string; srcset: string; sizes: string }
  }
  export function useImage(): ImageHelper
}
