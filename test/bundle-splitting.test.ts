import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const fixturesRoot = join(repoRoot, 'test', 'fixtures')
const fixtureNames = ['album-img-no-lightbox', 'lightbox-only'] as const
const textExtensions = new Set([
  '.css',
  '.d.ts',
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.ts',
])

type FixtureName = (typeof fixtureNames)[number]
type FixtureArtifacts = {
  components: string
  imports: string
  outputText: string
}

const artifacts = new Map<FixtureName, FixtureArtifacts>()

function fixtureDir(name: FixtureName) {
  return join(fixturesRoot, name)
}

async function cleanFixture(name: FixtureName) {
  for (const directory of ['.nuxt', '.output']) {
    await rm(join(fixtureDir(name), directory), { force: true, recursive: true })
  }
}

function collectText(root: string): string {
  const entries = readdirSync(root, { withFileTypes: true })
  let output = ''

  for (const entry of entries) {
    const filePath = join(root, entry.name)

    if (entry.isDirectory()) {
      output += collectText(filePath)
      continue
    }

    if (!textExtensions.has(extname(entry.name))) {
      continue
    }

    output += readFileSync(filePath, 'utf8')
    output += '\n'
  }

  return output
}

function buildFixture(name: FixtureName) {
  execFileSync('npx', ['nuxi', 'build', fixtureDir(name)], {
    cwd: repoRoot,
    stdio: 'pipe',
  })

  artifacts.set(name, {
    components: readFileSync(join(fixtureDir(name), '.nuxt', 'components.d.ts'), 'utf8'),
    imports: readFileSync(join(fixtureDir(name), '.nuxt', 'imports.d.ts'), 'utf8'),
    outputText: collectText(join(fixtureDir(name), '.output')),
  })
}

function fixtureArtifacts(name: FixtureName) {
  const builtArtifacts = artifacts.get(name)
  if (!builtArtifacts) {
    throw new Error(`Missing build artifacts for fixture ${name}`)
  }

  return builtArtifacts
}

describe('bundle partitioning', () => {
  beforeAll(async () => {
    for (const fixtureName of fixtureNames) {
      await cleanFixture(fixtureName)
      buildFixture(fixtureName)
    }
  }, 300_000)

  afterAll(async () => {
    for (const fixtureName of fixtureNames) {
      await cleanFixture(fixtureName)
    }
  })

  it('drops lightbox auto-imports and runtime when lightbox is disabled', () => {
    const { components, imports, outputText } = fixtureArtifacts('album-img-no-lightbox')

    expect(components).toContain('PhotoAlbum')
    expect(components).toContain('PhotoImg')
    expect(components).toContain('PhotoImage')
    expect(components).not.toContain('PhotoLightbox')
    expect(components).not.toContain('PhotoGallery')
    expect(components).not.toContain('PhotoLightboxAlbum')
    expect(components).not.toContain('PhotoLightboxImg')
    expect(imports).not.toContain('usePhotoLightbox')

    expect(outputText).toContain('photo-album__photo-button')
    expect(outputText).toContain('photo-img__caption')
  })

  it('drops album/img auto-imports and CSS when only lightbox is enabled', () => {
    const { components, imports, outputText } = fixtureArtifacts('lightbox-only')

    expect(components).toContain('PhotoLightbox')
    expect(components).toContain('PhotoGallery')
    expect(components).not.toContain('PhotoAlbum')
    expect(components).not.toContain('PhotoImg')
    expect(components).not.toContain('PhotoImage')
    expect(components).not.toContain('PhotoLightboxAlbum')
    expect(components).not.toContain('PhotoLightboxImg')
    expect(imports).toContain('usePhotoLightbox')

    expect(outputText).toContain('photo-lightbox')
    expect(outputText).not.toContain('photo-album__photo-button')
    expect(outputText).not.toContain('photo-img__caption')
    expect(outputText).not.toContain('computeColumnsLayout')
    expect(outputText).not.toContain('computeMasonryLayout')
  })
})
