import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('Nuxt Photo 1.0 public contract', () => {
  it('keeps the carousel contract direct and lightbox opt-in', () => {
    const carousel = read('packages/vue/src/components/PhotoCarousel.vue')
    const publicProps = carousel.slice(carousel.indexOf('defineProps<{'), carousel.indexOf('}>(),'))

    expect(publicProps).toContain('loop?: boolean')
    expect(publicProps).toContain('dragFree?: boolean')
    expect(carousel).toMatch(/lightbox:\s*undefined/)
  })

  it('publishes only the reviewed package entry points', () => {
    const vueManifest = JSON.parse(read('packages/vue/package.json')) as {
      exports: Record<string, unknown>
    }
    const nuxtManifest = JSON.parse(read('packages/nuxt/package.json')) as {
      exports: Record<string, unknown>
    }

    expect(Object.keys(vueManifest.exports).sort()).toEqual(
      [
        '.',
        './agent-docs',
        './lightbox.css',
        './primitives',
        './styles.css',
        './styles/*',
        // Internal entries for `@lupinum/nuxt-photo` of the same version.
        './internal',
        './locales/photo',
        './locales/viewer',
        './viewer',
      ].sort(),
    )
    expect(Object.keys(nuxtManifest.exports).sort()).toEqual(
      ['.', './agent-docs', './app', './lightbox.css', './primitives'].sort(),
    )
    // Only the stylesheets form a pattern; every code entry is named.
    expect(
      [...Object.keys(vueManifest.exports), ...Object.keys(nuxtManifest.exports)].filter((entry) =>
        entry.includes('*'),
      ),
    ).toEqual(['./styles/*'])
  })
})
