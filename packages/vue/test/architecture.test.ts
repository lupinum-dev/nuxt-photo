import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

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

  it('keeps Nuxt source on public Vue package entry points', () => {
    const allowedVuePackageImports = new Set([
      '@lupinum/vue-photo',
      '@lupinum/vue-photo/composables',
      '@lupinum/vue-photo/provide',
      '@lupinum/vue-photo/types',
    ])

    const offenders = sourceFiles('packages/nuxt/src').flatMap((file) => {
      const imports = importSpecifiers(read(file)).filter((specifier) => {
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

  it('keeps production components free of test fixture imports', () => {
    expect(
      relativeOffenders(
        sourceFiles('packages/vue/src/components'),
        (text) => text.includes('@test-fixtures') || text.includes('test/fixtures'),
      ),
    ).toEqual([])
  })

  it('keeps duplicated Nuxt app runtime declarations in sync', () => {
    expect(read('packages/nuxt/src/runtime/app.d.ts')).toBe(
      read('packages/nuxt/src/runtime/app.ts'),
    )
  })

  it('quarantines private Embla APIs and keeps vendor types out of public contracts', () => {
    const productionFiles = sourceFiles('packages/vue/src')
    expect(relativeOffenders(productionFiles, (text) => text.includes('internalEngine()'))).toEqual(
      ['packages/vue/src/integrations/embla/snapModel.ts'],
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
