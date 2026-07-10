import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const requiredPackageFiles = ['package.json', 'README.md', 'LICENSE']

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  })
}

function readPackedPackageJson(tarball) {
  const raw = run('tar', ['-xOf', tarball, 'package/package.json'])
  return JSON.parse(raw)
}

function listPackedFiles(tarball) {
  return run('tar', ['-tf', tarball]).trim().split('\n').filter(Boolean)
}

function collectExportTargets(value) {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object') return []
  return Object.values(value).flatMap(collectExportTargets)
}

function assertPackedPath(files, packageName, target) {
  if (!target?.startsWith('./')) return

  const packedTarget = `package/${target.slice(2)}`
  if (packedTarget.includes('*')) {
    const prefix = packedTarget.slice(0, packedTarget.indexOf('*'))
    assert(
      files.some((file) => file.startsWith(prefix)),
      `${packageName} export target ${target} matched no packed files`,
    )
    return
  }

  assert(
    files.includes(packedTarget),
    `${packageName} export target ${target} is missing from the tarball`,
  )
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function readPackageManifest(packageDir) {
  return JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
}

function discoverPackages() {
  const packageRoot = 'packages'
  const packages = readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const packageDir = join(packageRoot, entry.name)
      const manifest = readPackageManifest(packageDir)
      return {
        name: manifest.name,
        version: manifest.version,
        dir: packageDir,
        dependencies: Object.keys({
          ...manifest.dependencies,
          ...manifest.peerDependencies,
          ...manifest.optionalDependencies,
        }),
      }
    })
    .filter((pkg) => pkg.name?.startsWith('@nuxt-photo/'))

  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const sorted = []
  const visiting = new Set()
  const visited = new Set()

  function visit(pkg) {
    if (visited.has(pkg.name)) return
    assert(
      !visiting.has(pkg.name),
      `Circular package dependency at ${pkg.name}`,
    )
    visiting.add(pkg.name)

    for (const dependency of pkg.dependencies) {
      const workspaceDependency = byName.get(dependency)
      if (workspaceDependency) visit(workspaceDependency)
    }

    visiting.delete(pkg.name)
    visited.add(pkg.name)
    sorted.push(pkg)
  }

  for (const pkg of packages.toSorted((a, b) => a.name.localeCompare(b.name))) {
    visit(pkg)
  }

  return sorted
}

const packages = discoverPackages()
assert(packages.length > 0, 'No @nuxt-photo packages found in packages/*')

const packDir = mkdtempSync(join(tmpdir(), 'nuxt-photo-pack-'))
const packedTarballs = new Map()

try {
  for (const { name: packageName, version, dir: packageDir } of packages) {
    const before = new Set(readdirSync(packDir))
    run('pnpm', ['pack', '--pack-destination', packDir], {
      cwd: packageDir,
    })

    const tarballName = readdirSync(packDir).find((file) => !before.has(file))
    assert(tarballName, `No tarball produced for ${packageName}`)

    const tarball = join(packDir, tarballName)
    packedTarballs.set(packageName, tarball)
    const packageJson = readPackedPackageJson(tarball)
    const files = listPackedFiles(tarball)

    assert(
      packageJson.name === packageName,
      `Packed ${packageName} produced ${packageJson.name}`,
    )
    assert(
      packageJson.version === version,
      `${packageName} package version is ${packageJson.version}`,
    )
    assert(
      packageJson.license === 'MIT',
      `${packageName} package license is ${packageJson.license}`,
    )
    assert(
      files.some((file) => file.startsWith('package/dist/')),
      `${packageName} tarball is missing dist files`,
    )

    for (const required of requiredPackageFiles) {
      assert(
        files.includes(`package/${required}`),
        `${packageName} tarball is missing ${required}`,
      )
    }

    for (const target of collectExportTargets(packageJson.exports)) {
      assertPackedPath(files, packageName, target)
    }

    assertPackedPath(files, packageName, packageJson.main)
    assertPackedPath(files, packageName, packageJson.types)

    const dependencyBlocks = [
      packageJson.dependencies,
      packageJson.peerDependencies,
      packageJson.optionalDependencies,
    ].filter(Boolean)

    for (const block of dependencyBlocks) {
      for (const [dependency, range] of Object.entries(block)) {
        assert(
          !String(range).startsWith('workspace:'),
          `${packageName} dependency ${dependency} was not rewritten: ${range}`,
        )
      }
    }

    process.stdout.write(`packed ${packageName}: ${tarballName}\n`)
  }

  const consumerDir = join(packDir, 'consumer')
  mkdirSync(consumerDir)
  const rootManifest = readPackageManifest('.')
  const nuxtManifest = readPackageManifest('packages/nuxt')
  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify(
      {
        name: 'nuxt-photo-packed-consumer',
        private: true,
        type: 'module',
        packageManager: rootManifest.packageManager,
        dependencies: {
          '@nuxt-photo/nuxt': `file:${packedTarballs.get('@nuxt-photo/nuxt')}`,
          '@nuxt-photo/vue': `file:${packedTarballs.get('@nuxt-photo/vue')}`,
          nuxt: nuxtManifest.devDependencies.nuxt,
          vue: rootManifest.devDependencies.vue,
        },
        pnpm: {
          overrides: {
            '@nuxt-photo/vue': `file:${packedTarballs.get('@nuxt-photo/vue')}`,
          },
        },
      },
      null,
      2,
    ),
  )

  run('pnpm', ['install', '--offline', '--ignore-scripts'], {
    cwd: consumerDir,
  })

  const smokeScript = `
    import { existsSync } from 'node:fs'
    import { fileURLToPath } from 'node:url'

    const nuxtModule = await import('@nuxt-photo/nuxt')

    if (!nuxtModule.default) throw new Error('Packed Nuxt module has no default export')

    const moduleUrl = import.meta.resolve('@nuxt-photo/nuxt')
    const requiredSiblingFiles = [
      '../../vue/dist/components/Photo.vue',
      '../../vue/dist/components/PhotoAlbum.vue',
      '../../vue/dist/components/PhotoCarousel.vue',
      '../../vue/dist/components/PhotoGroup.vue',
      '../../vue/dist/styles/lightbox-structure.css',
    ]
    for (const relativePath of requiredSiblingFiles) {
      const path = fileURLToPath(new URL(relativePath, moduleUrl))
      if (!existsSync(path)) {
        throw new Error('Packed Nuxt relative package resolution failed: ' + path)
      }
    }
  `
  run('node', ['--input-type=module', '--eval', smokeScript], {
    cwd: consumerDir,
  })

  writeFileSync(
    join(consumerDir, 'nuxt.config.mjs'),
    `export default {
      modules: ['@nuxt-photo/nuxt'],
      nuxtPhoto: { css: 'structure', image: false },
    }\n`,
  )
  writeFileSync(
    join(consumerDir, 'app.vue'),
    `<script setup lang="ts">
      import { PhotoValidationError, type PhotoItem } from '@nuxt-photo/nuxt/app'
      import { responsive } from '@nuxt-photo/vue'
      import { useContainerWidth } from '@nuxt-photo/vue/composables'
      import type { LightboxCaptionSlotProps } from '@nuxt-photo/vue/types'
      const photos: readonly PhotoItem[] = [
        { id: 'packed', src: '/packed.jpg', width: 1200, height: 800 },
      ]
      const spacing = responsive({ 0: 4, 800: 8 })
      void PhotoValidationError
      void useContainerWidth
      const caption: LightboxCaptionSlotProps['photo'] = photos[0] ?? null
      void caption
    </script>
    <template>
      <PhotoAlbum :photos="photos" :layout="{ type: 'rows' }" :spacing="spacing" />
    </template>\n`,
  )
  run('pnpm', ['exec', 'nuxt', 'build'], { cwd: consumerDir })
  assert(
    existsSync(join(consumerDir, '.output/server/index.mjs')),
    'Packed Nuxt consumer did not produce a server build',
  )

  const installedVueRoot = join(
    consumerDir,
    'node_modules',
    '@nuxt-photo',
    'vue',
  )
  const publicDeclarations = [
    'dist/index.d.ts',
    'dist/components/PhotoCarousel.vue.d.ts',
  ]
  for (const declaration of publicDeclarations) {
    const path = join(installedVueRoot, declaration)
    assert(existsSync(path), `Packed consumer is missing ${declaration}`)
    assert(
      !/\bEmbla\w*/.test(readFileSync(path, 'utf8')),
      `${declaration} leaks an Embla type through the public package`,
    )
  }

  process.stdout.write(
    'packed consumer: Nuxt build, declarations, and sibling paths verified\n',
  )
} finally {
  rmSync(packDir, { recursive: true, force: true })
}
