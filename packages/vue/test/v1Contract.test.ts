import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && /\.(ts|vue)$/.test(entry.name) ? [path] : []
  })
}

function allFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    return entry.isDirectory() ? allFiles(path) : entry.isFile() ? [path] : []
  })
}

function filesContaining(files: readonly string[], text: string) {
  return files
    .filter((file) => read(file).includes(text))
    .map((file) => relative(process.cwd(), file))
}

describe('Nuxt Photo 1.0 public contract', () => {
  const productionFiles = sourceFiles('packages/vue/src')

  it('does not restore rejected implementation or compatibility paths', () => {
    for (const rejected of [
      'internalEngine()',
      'measureImage(',
      'useLightboxProvider',
      'LightboxDefaults',
    ]) {
      expect(filesContaining(productionFiles, rejected), rejected).toEqual([])
    }

    expect(productionFiles.some((file) => file.endsWith('/snapModel.ts'))).toBe(false)
  })

  it('keeps the carousel contract direct and lightbox opt-in', () => {
    const carousel = read('packages/vue/src/components/PhotoCarousel.vue')
    const publicProps = carousel.slice(carousel.indexOf('defineProps<{'), carousel.indexOf('}>(),'))

    expect(publicProps).toContain("direction?: 'ltr' | 'rtl'")
    expect(publicProps).toContain('loop?: boolean')
    expect(publicProps).toContain('dragFree?: boolean')
    expect(publicProps).not.toContain('options?:')
    expect(publicProps).not.toContain('slidesToScroll')
    expect(carousel).toMatch(/lightbox:\s*false/)
  })

  it('exposes collection handles only from PhotoAlbum and PhotoGroup', () => {
    expect(read('packages/vue/src/components/PhotoAlbum.vue')).toContain(
      'defineExpose({ open, openById, close, isOpen })',
    )
    expect(read('packages/vue/src/components/PhotoGroup.vue')).toContain(
      'defineExpose({ open, openById, close, isOpen })',
    )
    expect(read('packages/vue/src/components/Photo.vue')).not.toContain('defineExpose(')
    expect(read('packages/vue/src/components/PhotoCarousel.vue')).not.toContain('defineExpose(')
  })

  it('publishes only the reviewed package entry points', () => {
    const vueManifest = JSON.parse(read('packages/vue/package.json')) as {
      exports: Record<string, unknown>
    }
    const nuxtManifest = JSON.parse(read('packages/nuxt/package.json')) as {
      exports: Record<string, unknown>
    }

    expect(Object.keys(vueManifest.exports).sort()).toEqual(
      ['.', './composables', './provide', './styles.css', './types'].sort(),
    )
    expect(Object.keys(nuxtManifest.exports).sort()).toEqual(['.', './app'].sort())
    expect([...Object.keys(vueManifest.exports), ...Object.keys(nuxtManifest.exports)]).not.toEqual(
      expect.arrayContaining([expect.stringContaining('*')]),
    )
  })

  it('keeps one migration guide and no hand-written release history', () => {
    const migrationGuides = allFiles('docs/content').filter((file) =>
      /upgrade-from-0-2/i.test(file),
    )
    const releaseHistories = allFiles('docs/content').filter((file) =>
      /(?:release-history|releases|changelog)/i.test(file),
    )

    expect(migrationGuides).toEqual(['docs/content/docs/5.help/3.upgrade-from-0-2-to-1-0.md'])
    expect(releaseHistories).toEqual([])
  })
})
