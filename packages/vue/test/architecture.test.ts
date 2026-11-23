import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'
import vuePackage from '../package.json'

/** The Vue package imports its own named seams by name; each maps to its source file. */
const selfReferences = new Map<string, string>(
  Object.entries(vuePackage.exports).flatMap(([entry, target]) =>
    typeof target === 'object' && 'import' in target
      ? [
          [
            `@lupinum/vue-photo${entry.slice(1)}`,
            target.import.replace('./dist/', 'packages/vue/src/').replace(/\.mjs$/, '.ts'),
          ] as const,
        ]
      : [],
  ),
)

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && /\.(ts|vue)$/.test(entry.name) ? [path] : []
  })
}

function read(path: string) {
  return readFileSync(path, 'utf8')
}

function importSpecifiers(source: string) {
  return [
    ...source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g),
  ].map((match) => match[1]!)
}

/** Runtime imports of a source file: no `import type`, no all-type braces, no dynamic import(). */
function runtimeImports(source: string) {
  return [
    ...source.matchAll(
      /^\s*(?:import|export)\s+(type\s+)?(?:([^'"]*?)\s*from\s*)?['"]([^'"]+)['"]/gm,
    ),
  ]
    .filter(([, typeOnly, names]) => {
      if (typeOnly) return false
      const braces = names?.match(/^\{([^}]*)\}$/s)?.[1]
      return !braces?.split(',').every((name) => !name.trim() || name.trim().startsWith('type '))
    })
    .map((match) => match[3]!)
}

/** Every file and package that `entry` reaches through static runtime imports. */
function staticImportGraph(entry: string) {
  const seen = new Set<string>()
  const packages = new Set<string>()
  const pending = [entry]
  while (pending.length) {
    const file = pending.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    for (const specifier of runtimeImports(read(file))) {
      const self = selfReferences.get(specifier)
      if (self) {
        pending.push(self)
        continue
      }
      if (!specifier.startsWith('.')) {
        packages.add(specifier)
        continue
      }
      // Stylesheets import no code.
      if (specifier.endsWith('.css')) continue
      const base = join(dirname(file), specifier)
      const resolved = [base, `${base}.ts`, join(base, 'index.ts')].find(
        (candidate) => /\.(ts|vue)$/.test(candidate) && existsSync(candidate),
      )
      if (!resolved) throw new Error(`${file}: cannot resolve ${specifier}`)
      pending.push(resolved)
    }
  }
  return { files: [...seen], packages: [...packages] }
}

function relativeOffenders(files: string[], predicate: (text: string) => boolean) {
  return files.filter((file) => predicate(read(file))).map((file) => relative(process.cwd(), file))
}

describe('source architecture boundaries', () => {
  it('keeps core independent from Vue, Nuxt, components, and runtime wiring', () => {
    const offenders = sourceFiles('packages/vue/src/core').flatMap((file) => {
      const imports = importSpecifiers(read(file)).filter(
        (specifier) =>
          specifier === 'vue' ||
          specifier.startsWith('@nuxt') ||
          specifier.includes('/components') ||
          specifier.includes('/composables') ||
          specifier.includes('/context') ||
          specifier.includes('/provide') ||
          specifier.includes('/internal'),
      )

      return imports.map((specifier) => `${relative(process.cwd(), file)} -> ${specifier}`)
    })

    expect(offenders).toEqual([])
  })

  it('keeps Nuxt source on public entry points except shared build-time config and locale data', () => {
    const allowedVuePackageImports = new Set([
      '@lupinum/vue-photo',
      '@lupinum/vue-photo/primitives',
      '@lupinum/vue-photo/internal',
    ])

    const offenders = sourceFiles('packages/nuxt/src').flatMap((file) => {
      const imports = importSpecifiers(read(file)).filter((specifier) => {
        // Build-time setup shares validation and locale data without loading Vue SFC exports in Node.
        if (
          file === 'packages/nuxt/src/options.ts' &&
          specifier === '../../vue/src/config/validate'
        )
          return false
        if (
          file === 'packages/nuxt/src/locales.ts' &&
          [
            '../../vue/src/provide/photoLocaleTemplates',
            '../../vue/src/provide/viewerLocaleTemplates',
            '../../vue/src/provide/labelTypes',
          ].includes(specifier)
        )
          return false
        if (specifier.includes('/vue/src') || specifier.includes('../../vue/src')) {
          return true
        }
        if (!specifier.startsWith('@lupinum/vue-photo')) return false
        return !allowedVuePackageImports.has(specifier)
      })

      return imports.map((specifier) => `${relative(process.cwd(), file)} -> ${specifier}`)
    })

    expect(offenders).toEqual([])
  })

  // An album, photo, carousel or group page ships no viewer code until someone reaches for a
  // photo: the viewer is one dynamic import() away (`@lupinum/vue-photo/viewer`).
  it.each([
    ['components/Photo.vue', false],
    ['components/PhotoAlbum.vue', false],
    ['components/PhotoCarousel.vue', true],
    ['components/PhotoGroup.vue', false],
    ['components/photo-group/usePhotoGroup.ts', false],
  ])('keeps viewer code out of the static imports of %s', (entry, ownsEmbla) => {
    const src = 'packages/vue/src/'
    const { files, packages } = staticImportGraph(src + entry)
    const viewerFiles = files
      .map((file) => file.slice(src.length))
      .filter(
        (file) =>
          file.startsWith('lightbox/') ||
          file.startsWith('core/viewer/zoom') ||
          file.startsWith('core/viewer/gestures') ||
          file.startsWith('core/transition/') ||
          file === 'components/Lightbox.vue' ||
          /^primitives\/(Lightbox|PhotoTrigger)/.test(file) ||
          file === 'primitives/index.ts' ||
          file.startsWith('internal/Lightbox') ||
          file === 'provide/viewerLabels.ts' ||
          file === 'provide/viewerLocaleTemplates.ts' ||
          file === 'composables/usePhotoLabels.ts',
      )
    expect(viewerFiles).toEqual([])
    if (!ownsEmbla) expect(packages.filter((name) => name.startsWith('embla'))).toEqual([])
  })

  // The lightbox has one drag engine, its own; Embla serves only PhotoCarousel.
  it('keeps Embla out of the lightbox', () => {
    const src = 'packages/vue/src/'
    const lightboxFiles = [
      ...sourceFiles(src + 'lightbox'),
      ...sourceFiles(src + 'primitives'),
      src + 'components/Lightbox.vue',
    ]
    const offenders = lightboxFiles.flatMap((file) => {
      const { files, packages } = staticImportGraph(file)
      const viaEmbla = files.filter((reached) => reached.endsWith('gallery/embla.ts'))
      return [...packages.filter((name) => name.startsWith('embla')), ...viaEmbla].map(
        (name) => `${relative(process.cwd(), file)} -> ${name}`,
      )
    })
    expect(offenders).toEqual([])
    expect(
      relativeOffenders(lightboxFiles, (text) =>
        importSpecifiers(text).some((specifier) => specifier.includes('embla')),
      ),
    ).toEqual([])
  })

  it('keeps production components free of test fixture imports', () => {
    expect(
      relativeOffenders(
        sourceFiles('packages/vue/src/components'),
        (text) => text.includes('@test-fixtures') || text.includes('test/fixtures'),
      ),
    ).toEqual([])
  })

  it.each(['app', 'primitives'])('keeps the duplicated Nuxt %s declarations in sync', (entry) => {
    expect(read(`packages/nuxt/src/runtime/${entry}.d.ts`)).toBe(
      read(`packages/nuxt/src/runtime/${entry}.ts`),
    )
  })

  it('keeps private Embla APIs and vendor types out of public contracts', () => {
    const productionFiles = sourceFiles('packages/vue/src')
    expect(relativeOffenders(productionFiles, (text) => text.includes('internalEngine()'))).toEqual(
      [],
    )

    const publicContractFiles = [
      'packages/vue/src/index.ts',
      'packages/vue/src/core/types.ts',
      'packages/vue/src/provide/keys.ts',
      'packages/vue/src/types/slots.ts',
    ]
    expect(publicContractFiles.filter((file) => /\bEmbla\w*/.test(read(file)))).toEqual([])
  })
})
