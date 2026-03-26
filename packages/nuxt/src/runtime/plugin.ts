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

      if (context === 'slide') {
        // Generate srcset explicitly — avoids getSizes() format issues with @nuxt/image v2
        // Lightbox media area is min(1240px, calc(100vw - 72px))
        const quality = 85
        const targetWidths = [640, 960, 1240, 1600, 2000]
        const widths = targetWidths.filter(w => w <= photo.width * 1.5)
        const srcsetWidths = widths.length > 0 ? widths : [Math.min(1240, photo.width)]

        const srcset = srcsetWidths
          .map(w => `${image(src, { width: w, quality })} ${w}w`)
          .join(', ')

        return {
          src: image(src, { width: Math.min(1240, photo.width), quality }),
          srcset,
          sizes: 'min(1240px, calc(100vw - 72px))',
          width: photo.width,
          height: photo.height,
        }
      }

      // thumb context: use Nuxt Image v2 breakpoint syntax (not CSS media queries)
      const sizes = 'sm:100vw md:50vw lg:400px'
      const result = image.getSizes(src, { sizes, quality: 80 })

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
