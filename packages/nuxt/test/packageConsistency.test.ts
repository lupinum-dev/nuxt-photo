import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const removedPackageReferences = [
  '@nuxt-photo/core',
  '@nuxt-photo/recipes',
  'packages/core',
  'packages/recipes',
] as const

const activeFilesToScan = [
  '.fallowrc.json',
  '.github/workflows/publish.yml',
  '.github/workflows/size.yml',
  'README.md',
  'scripts/size/config.json',
  'scripts/size/run.mjs',
  'scripts/release/pack-dry-run.mjs',
]

function markdownFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return markdownFiles(path)
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : []
  })
}

function readText(path: string) {
  return readFileSync(path, 'utf8')
}

function workspacePackageNames() {
  return readdirSync('packages', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifest = JSON.parse(
        readText(join('packages', entry.name, 'package.json')),
      )
      return manifest.name as string
    })
    .filter((name) => name.startsWith('@nuxt-photo/'))
    .sort()
}

describe('package consistency', () => {
  it('tracks the actual public workspace packages', () => {
    expect(workspacePackageNames()).toEqual([
      '@nuxt-photo/nuxt',
      '@nuxt-photo/vue',
    ])
  })

  it('does not reference removed packages in active release/config/docs files', () => {
    const files = [...activeFilesToScan, ...markdownFiles('docs/content/docs')]
    const offenders = files.flatMap((file) => {
      const text = readText(file)
      return removedPackageReferences
        .filter((reference) => text.includes(reference))
        .map((reference) => `${file}: ${reference}`)
    })

    expect(offenders).toEqual([])
  })

  it('publishes only existing public packages', () => {
    const workflow = readText('.github/workflows/publish.yml')
    const publishedPackages = [
      ...workflow.matchAll(/--filter (@nuxt-photo\/\w+)/g),
    ]
      .map((match) => match[1])
      .sort()

    expect(publishedPackages).toEqual(workspacePackageNames())
  })
})
