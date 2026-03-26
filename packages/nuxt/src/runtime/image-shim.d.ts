// Minimal type shim for @nuxt/image's virtual '#image' module.
// Only used for local TypeScript checking in the nuxt package build.
// The real module is provided by @nuxt/image at runtime in the consumer's app.
declare module '#image' {
  interface ImageOptions {
    width?: number
    height?: number
    quality?: number
    format?: string
    [key: string]: unknown
  }
  interface ImageSizesOptions extends ImageOptions {
    sizes?: string
  }
  interface ImageHelper {
    (src: string, options?: ImageOptions): string
    getSizes(src: string, options?: ImageSizesOptions): { src: string; srcset: string; sizes: string }
  }
  export function useImage(): ImageHelper
}
