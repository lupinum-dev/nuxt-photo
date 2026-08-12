import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, sep } from 'node:path'

import { assert, readJson, readWorkspaceCatalog } from './package-set.mjs'

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function run(command, args, directory) {
  execFileSync(command, args, {
    cwd: directory,
    stdio: 'inherit',
  })
}

function assertInstalledOutsideRepository(path, rootDir, packageName) {
  assert(existsSync(path), `${packageName} was not installed in the clean consumer.`)
  const realPath = realpathSync(path)
  assert(
    !realPath.startsWith(`${rootDir}${sep}`),
    `${packageName} resolved into the source workspace.`,
  )
}

function copyArtifact(consumerDir, tarballPath) {
  const artifactDir = join(consumerDir, 'artifacts')
  mkdirSync(artifactDir, { recursive: true })
  const destination = join(artifactDir, basename(tarballPath))
  copyFileSync(tarballPath, destination)
  return destination
}

function catalogVersion(catalog, name) {
  const version = catalog[name]
  assert(version, `Workspace catalog has no ${name} version.`)
  return version
}

function runVueConsumer(rootDir, artifactByName, rootManifest, catalog) {
  const consumerDir = mkdtempSync(join(tmpdir(), 'nuxt-photo-vue-consumer-'))
  const vueTarball = copyArtifact(consumerDir, artifactByName.get('@lupinum/vue-photo').tarballPath)
  const srcDir = join(consumerDir, 'src')
  mkdirSync(srcDir)

  writeJson(join(consumerDir, 'package.json'), {
    name: 'nuxt-photo-vue-packed-consumer',
    private: true,
    type: 'module',
    packageManager: rootManifest.packageManager,
    dependencies: {
      '@lupinum/vue-photo': `file:${vueTarball}`,
      vue: catalogVersion(catalog, 'vue'),
    },
    devDependencies: {
      '@vitejs/plugin-vue': rootManifest.devDependencies['@vitejs/plugin-vue'],
      typescript: catalogVersion(catalog, 'typescript'),
      vite: catalogVersion(catalog, 'vite'),
      'vite-plus': catalogVersion(catalog, 'vite-plus'),
      'vue-tsc': catalogVersion(catalog, 'vue-tsc'),
    },
  })
  writeFileSync(
    join(consumerDir, 'pnpm-workspace.yaml'),
    [
      'autoInstallPeers: false',
      'enableGlobalVirtualStore: false',
      'strictPeerDependencies: true',
      'peerDependencyRules:',
      '  allowAny:',
      '    - vite',
      '  allowedVersions:',
      "    vite: '*'",
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(consumerDir, 'index.html'),
    '<div id="app"></div>\n<script type="module" src="/src/main.ts"></script>\n',
  )
  writeFileSync(
    join(consumerDir, 'build.mjs'),
    [
      "import vue from '@vitejs/plugin-vue'",
      "import { build } from 'vite'",
      '',
      'await build({',
      '  configFile: false,',
      '  root: process.cwd(),',
      '  plugins: [vue()],',
      '})',
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: ['vite/client'],
        },
        include: ['src/**/*.ts', 'src/**/*.vue'],
      },
      null,
      2,
    )}\n`,
  )
  writeFileSync(
    join(srcDir, 'main.ts'),
    [
      "import { createApp } from 'vue'",
      "import App from './App.vue'",
      '',
      "createApp(App).mount('#app')",
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(srcDir, 'App.vue'),
    [
      '<script setup lang="ts">',
      "import { PhotoAlbum, PhotoValidationError, responsive, type PhotoItem } from '@lupinum/vue-photo'",
      "import { useContainerWidth } from '@lupinum/vue-photo/composables'",
      "import type { LightboxCaptionSlotProps } from '@lupinum/vue-photo/types'",
      "import '@lupinum/vue-photo/styles.css'",
      '',
      "const photos: readonly PhotoItem[] = [{ id: 'packed', src: '/packed.jpg', width: 1200, height: 800 }]",
      'const spacing = responsive({ 0: 4, 800: 8 })',
      "const caption: LightboxCaptionSlotProps['photo'] = photos[0] ?? null",
      'void PhotoValidationError',
      'void useContainerWidth',
      'void caption',
      '</script>',
      '',
      '<template>',
      '  <PhotoAlbum :photos="photos" :layout="{ type: \'rows\' }" :spacing="spacing" />',
      '</template>',
      '',
    ].join('\n'),
  )

  try {
    run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], consumerDir)
    assertInstalledOutsideRepository(
      join(consumerDir, 'node_modules', '@lupinum', 'vue-photo'),
      rootDir,
      '@lupinum/vue-photo',
    )
    assert(
      !existsSync(join(consumerDir, 'node_modules', '@lupinum', 'nuxt-photo')),
      'Vue-only consumer unexpectedly installed @lupinum/nuxt-photo.',
    )
    run('pnpm', ['exec', 'vue-tsc', '-p', 'tsconfig.json', '--noEmit'], consumerDir)
    run('node', ['build.mjs'], consumerDir)
    assert(
      existsSync(join(consumerDir, 'dist', 'index.html')),
      'Vue-only packed consumer did not produce a Vite build.',
    )
  } finally {
    if (process.env.KEEP_PACKED_CONSUMERS === '1') {
      process.stdout.write(`Vue packed consumer retained at ${consumerDir}\n`)
    } else {
      rmSync(consumerDir, { recursive: true, force: true })
    }
  }
}

function collectListedVersions(value, packageName, versions = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectListedVersions(item, packageName, versions)
    }
    return versions
  }
  if (!value || typeof value !== 'object') {
    return versions
  }
  if (value.name === packageName && typeof value.version === 'string') {
    versions.push(value.version)
  }
  for (const [key, child] of Object.entries(value)) {
    if (
      key === packageName &&
      child &&
      typeof child === 'object' &&
      typeof child.version === 'string'
    ) {
      versions.push(child.version)
    }
    collectListedVersions(child, packageName, versions)
  }
  return versions
}

function nestNuxtVueDependency(realNuxtRoot, installedVueRoot) {
  const exactVueRoot = realpathSync(installedVueRoot)
  const nestedVueRoot = join(realNuxtRoot, 'node_modules', '@lupinum', 'vue-photo')

  mkdirSync(dirname(nestedVueRoot), { recursive: true })
  symlinkSync(exactVueRoot, nestedVueRoot, 'dir')

  unlinkSync(installedVueRoot)
  mkdirSync(installedVueRoot)
  writeJson(join(installedVueRoot, 'package.json'), {
    name: '@lupinum/vue-photo',
    version: '0.0.0-incompatible-app-copy',
    type: 'module',
    exports: './index.mjs',
  })
  writeFileSync(join(installedVueRoot, 'index.mjs'), 'export const incompatible = true\n')

  assert(
    realpathSync(nestedVueRoot) === exactVueRoot,
    'Nested Nuxt dependency does not point at the exact packed Vue package.',
  )
  assert(
    readJson(join(installedVueRoot, 'package.json')).version === '0.0.0-incompatible-app-copy',
    'The duplicate-layout proof did not install its incompatible sibling package.',
  )

  return nestedVueRoot
}

function runNuxtConsumer(rootDir, artifactByName, rootManifest, catalog) {
  const consumerDir = mkdtempSync(join(tmpdir(), 'nuxt-photo-nuxt-consumer-'))
  const nuxtTarball = copyArtifact(
    consumerDir,
    artifactByName.get('@lupinum/nuxt-photo').tarballPath,
  )
  const vueTarball = copyArtifact(consumerDir, artifactByName.get('@lupinum/vue-photo').tarballPath)

  writeJson(join(consumerDir, 'package.json'), {
    name: 'nuxt-photo-nuxt-packed-consumer',
    private: true,
    type: 'module',
    packageManager: rootManifest.packageManager,
    dependencies: {
      '@lupinum/nuxt-photo': `file:${nuxtTarball}`,
      nuxt: catalogVersion(catalog, 'nuxt'),
    },
    devDependencies: {
      typescript: catalogVersion(catalog, 'typescript'),
      'vue-tsc': catalogVersion(catalog, 'vue-tsc'),
    },
  })
  writeFileSync(
    join(consumerDir, 'pnpm-workspace.yaml'),
    [
      'autoInstallPeers: false',
      'enableGlobalVirtualStore: false',
      'strictPeerDependencies: true',
      'peerDependencyRules:',
      '  allowAny:',
      '    - vite',
      '  allowedVersions:',
      '    # Nuxt 4.4 resolves newer devtools whose optional unctx peer expects a newer parser.',
      "    oxc-parser: '*'",
      "    vite: '*'",
      'overrides:',
      `  '@lupinum/vue-photo': ${JSON.stringify(`file:${vueTarball}`)}`,
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(consumerDir, 'nuxt.config.ts'),
    [
      'export default defineNuxtConfig({',
      "  modules: ['@lupinum/nuxt-photo'],",
      "  nuxtPhoto: { css: 'structure', image: false },",
      '})',
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(consumerDir, 'app.vue'),
    [
      '<script setup lang="ts">',
      "import { PhotoValidationError, type PhotoItem } from '@lupinum/nuxt-photo/app'",
      '',
      "const photos: readonly PhotoItem[] = [{ id: 'packed', src: '/packed.jpg', width: 1200, height: 800 }]",
      'void PhotoValidationError',
      '</script>',
      '',
      '<template>',
      '  <PhotoAlbum :photos="photos" :layout="{ type: \'rows\' }" />',
      '</template>',
      '',
    ].join('\n'),
  )

  try {
    run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], consumerDir)

    const consumerManifest = readJson(join(consumerDir, 'package.json'))
    assert(
      consumerManifest.dependencies['@lupinum/vue-photo'] === undefined,
      'Nuxt-only consumer must not declare @lupinum/vue-photo directly.',
    )
    const installedNuxtRoot = join(consumerDir, 'node_modules', '@lupinum', 'nuxt-photo')
    assertInstalledOutsideRepository(installedNuxtRoot, rootDir, '@lupinum/nuxt-photo')
    const installedNuxtManifest = readJson(join(installedNuxtRoot, 'package.json'))
    assert(
      installedNuxtManifest.dependencies['@lupinum/vue-photo'] ===
        artifactByName.get('@lupinum/vue-photo').packageJson.version,
      'Packed Nuxt package does not depend on the exact Vue package-set version.',
    )

    const realNuxtRoot = realpathSync(installedNuxtRoot)
    const installedVueRoot = join(dirname(realNuxtRoot), 'vue-photo')
    assertInstalledOutsideRepository(installedVueRoot, rootDir, '@lupinum/vue-photo')
    const installedVueManifest = readJson(join(installedVueRoot, 'package.json'))
    assert(
      installedVueManifest.version === artifactByName.get('@lupinum/vue-photo').packageJson.version,
      'Nuxt-only consumer resolved the wrong @lupinum/vue-photo version.',
    )

    const listOutput = execFileSync(
      'pnpm',
      ['list', '@lupinum/vue-photo', '--depth', 'Infinity', '--json'],
      {
        cwd: consumerDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    )
    const listedVersions = collectListedVersions(JSON.parse(listOutput), '@lupinum/vue-photo')
    assert(
      new Set(listedVersions).size === 1,
      `Nuxt-only consumer resolved multiple @lupinum/vue-photo versions: ${listedVersions.join(', ')}.`,
    )
    assert(
      listedVersions[0] === artifactByName.get('@lupinum/vue-photo').packageJson.version,
      'Nuxt-only consumer resolved the wrong @lupinum/vue-photo version.',
    )

    const exactVueRoot = nestNuxtVueDependency(realNuxtRoot, installedVueRoot)

    run('pnpm', ['exec', 'nuxi', 'prepare'], consumerDir)
    run('pnpm', ['exec', 'vue-tsc', '-p', '.nuxt/tsconfig.app.json', '--noEmit'], consumerDir)
    run('pnpm', ['exec', 'nuxt', 'build'], consumerDir)
    assert(
      existsSync(join(consumerDir, '.output', 'server', 'index.mjs')),
      'Nuxt-only packed consumer did not produce a server build.',
    )

    const publicDeclarations = ['dist/index.d.ts', 'dist/components/PhotoCarousel.vue.d.ts']
    for (const declaration of publicDeclarations) {
      const path = join(exactVueRoot, declaration)
      assert(existsSync(path), `Packed consumer is missing ${declaration}.`)
      assert(
        !/\bEmbla\w*/.test(readFileSync(path, 'utf8')),
        `${declaration} leaks an Embla type through the public package.`,
      )
    }
  } finally {
    if (process.env.KEEP_PACKED_CONSUMERS === '1') {
      process.stdout.write(`Nuxt packed consumer retained at ${consumerDir}\n`)
    } else {
      rmSync(consumerDir, { recursive: true, force: true })
    }
  }
}

export function verifyPackedConsumers(rootDir, artifactPackages) {
  const artifactByName = new Map(artifactPackages.map((pkg) => [pkg.packageJson.name, pkg]))
  assert(
    artifactByName.has('@lupinum/vue-photo') && artifactByName.has('@lupinum/nuxt-photo'),
    'Packed consumers require both Nuxt Photo packages.',
  )

  const rootManifest = readJson(join(rootDir, 'package.json'))
  const catalog = readWorkspaceCatalog(rootDir)
  runVueConsumer(rootDir, artifactByName, rootManifest, catalog)
  runNuxtConsumer(rootDir, artifactByName, rootManifest, catalog)
}
