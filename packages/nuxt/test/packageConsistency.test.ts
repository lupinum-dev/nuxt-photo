import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

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

  it('publishes Vue before Nuxt and includes every public package', () => {
    const publishScript = readText('scripts/release/publish.mjs')
    const publishedPackages = [
      ...publishScript.matchAll(/readPackage\('([^']+)'\)/g),
    ].map((match) => {
      const manifest = JSON.parse(readText(join(match[1], 'package.json')))
      return manifest.name as string
    })

    expect(publishedPackages).toEqual(['@nuxt-photo/vue', '@nuxt-photo/nuxt'])
    expect(publishedPackages.toSorted()).toEqual(workspacePackageNames())
  })
})
