import { defineNuxtPlugin } from '#app'
import { useImage } from '#imports'
import type { ImageContext, ImageSource, PhotoItem } from '@nuxt-photo/core'
import { ImageAdapterKey } from '@nuxt-photo/vue/internal'

export default defineNuxtPlugin({
  name: 'nuxt-photo:image-adapter',
  setup(nuxtApp) {
    const image = useImage()

    const adapter = (photo: PhotoItem, context: ImageContext): ImageSource => {
      const src = context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src

      if (context === 'preload') {
        return {
          src: image(src, { width: 1600, quality: 85 }),
          width: photo.width,
          height: photo.height,
        }
      }

      const sizes = context === 'slide'
        ? '100vw'
        : '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px'
      const quality = context === 'slide' ? 85 : 80
      const result = image.getSizes(src, { sizes, quality })

      return {
        src: result.src,
        srcset: result.srcset,
        sizes: result.sizes,
        width: photo.width,
        height: photo.height,
      }
    }

    nuxtApp.vueApp.provide(ImageAdapterKey, adapter)
  },
})
