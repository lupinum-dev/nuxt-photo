import { build as viteBuild } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { cpSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import limits from './config.json' with { type: 'json' }
import { collectAssets } from './assets.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..', '..')
const nuxtPackageRoot = resolve(root, 'packages', 'nuxt')
const fixturesRoot = resolve(root, 'test', 'size')
const resultsRoot = resolve(root, 'test-results', 'size')
const analyzeRoot = resolve(root, 'test-results', 'size-analyze')
const nuxiBin = resolve(nuxtPackageRoot, 'node_modules', '.bin', 'nuxi')

const args = process.argv.slice(2)
const analyze = args.includes('--analyze')
const skipBuild = args.includes('--skip-build')
const target = ['vue', 'nuxt'].find((arg) => args.includes(arg)) ?? 'all'

const vueScenarios = [
  { id: 'responsive', name: 'vue:responsive' },
  { id: 'use-lightbox', name: 'vue:use-lightbox' },
  { id: 'photo-image', name: 'vue:photo-image' },
  { id: 'all', name: 'vue:all' },
]

const nuxtScenarios = [
  { id: 'baseline', name: 'nuxt:baseline' },
  { id: 'module', name: 'nuxt:module' },
  { id: 'usage', name: 'nuxt:usage' },
  { id: 'album', name: 'nuxt:album' },
]

void main()

async function main() {
  prepareDir(resultsRoot)
  if (analyze) prepareDir(analyzeRoot)

  if (!skipBuild) ensureBuild(target)

  const failures = []

  if (target === 'all' || target === 'vue') {
    const rows = []
    for (const scenario of vueScenarios) {
      const result = await measureViteFixture(scenario.id)
      const passed = result.brotli <= limits.vue[scenario.id].brotliLimit
      if (!passed) failures.push(scenario.name)
      rows.push([
        limits.vue[scenario.id].label,
        formatBytes(result.raw),
        formatBytes(result.gzip),
        formatBytes(result.brotli),
        formatBytes(limits.vue[scenario.id].brotliLimit),
        passed ? 'PASS' : 'FAIL',
      ])
    }
    printTable('Vue', ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Limit(br)', 'Status'], rows)
  }

  if (target === 'all' || target === 'nuxt') {
    const measured = new Map()
    for (const scenario of nuxtScenarios) {
      measured.set(scenario.id, runNuxtFixture(scenario.id))
    }
    const baseline = measured.get('baseline')
    const measuredScenarios = nuxtScenarios
      .filter((scenario) => scenario.id !== 'baseline')
      .map((scenario) => {
        const result = measured.get(scenario.id)
        const delta = diffSizes(result, baseline)
        const passed = delta.brotli <= limits.nuxt[scenario.id].brotliDeltaLimit
        if (!passed) failures.push(scenario.name)
        return { ...scenario, result, delta, passed }
      })

    printTable(
      'Nuxt',
      ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Delta(br)', 'Limit(br)', 'Status'],
      [
        [
          'baseline build',
          formatBytes(baseline.raw),
          formatBytes(baseline.gzip),
          formatBytes(baseline.brotli),
          '-',
          '-',
          'BASELINE',
        ],
        ...measuredScenarios.map(({ id, result, delta, passed }) => [
          limits.nuxt[id].label,
          formatBytes(result.raw),
          formatBytes(result.gzip),
          formatBytes(result.brotli),
          formatSignedBytes(delta.brotli),
          formatBytes(limits.nuxt[id].brotliDeltaLimit),
          passed ? 'PASS' : 'FAIL',
        ]),
      ],
    )
  }

  if (analyze) {
    console.log(`\nAnalyze output written to ${relative(root, analyzeRoot) || analyzeRoot}`)
  }

  if (failures.length > 0) {
    console.error(`\nSize regression detected in: ${failures.join(', ')}`)
    process.exit(1)
  }
}

function ensureBuild(surface) {
  if (surface === 'all') {
    runCommand('pnpm', ['run', 'build'])
    return
  }

  const buildSets = {
    vue: ['@lupinum/vue-photo'],
    nuxt: ['@lupinum/vue-photo', '@lupinum/nuxt-photo'],
  }

  for (const pkg of buildSets[surface]) {
    runCommand('pnpm', ['--filter', pkg, 'build'])
  }
}

async function measureViteFixture(fixtureId) {
  const tempDir = prepareFixture('vue', fixtureId)
  const analyzerFile = resolve(analyzeRoot, `vite-${fixtureId}.html`)

  await viteBuild({
    configFile: false,
    root: tempDir,
    logLevel: 'silent',
    plugins: [
      vue(),
      analyze
        ? visualizer({
            filename: analyzerFile,
            gzipSize: true,
            brotliSize: true,
            open: false,
            template: 'treemap',
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@lupinum/vue-photo': resolve(root, 'packages', 'vue', 'dist', 'index.mjs'),
      },
      preserveSymlinks: false,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild',
      reportCompressedSize: false,
      rollupOptions: {
        external: ['vue'],
      },
    },
  })

  const assets = collectAssets(resolve(tempDir, 'dist', 'assets'))
  if (analyze) {
    writeFileSync(
      resolve(analyzeRoot, `vite-${fixtureId}.assets.json`),
      JSON.stringify(assets.files, null, 2),
    )
  }
  return assets.totals
}

function runNuxtFixture(fixtureId) {
  const tempDir = prepareFixture('nuxt', fixtureId)
  symlinkSync(resolve(nuxtPackageRoot, 'node_modules'), resolve(tempDir, 'node_modules'), 'dir')
  runCommand(nuxiBin, ['build', tempDir], {
    cwd: nuxtPackageRoot,
    env: {
      ...process.env,
      NUXT_TELEMETRY_DISABLED: '1',
      NUXT_PHOTO_SIZE_MODULE_PATH: resolve(nuxtPackageRoot, 'dist', 'module.mjs'),
    },
  })
  const assets = collectAssets(resolve(tempDir, '.output', 'public', '_nuxt'))
  if (analyze) {
    writeFileSync(
      resolve(analyzeRoot, `nuxt-${fixtureId}.assets.json`),
      JSON.stringify(assets.files, null, 2),
    )
  }
  return assets.totals
}

function prepareFixture(surface, fixtureId) {
  const sourceDir = resolve(fixturesRoot, surface, fixtureId)
  const tempDir = resolve(resultsRoot, `${surface}-${fixtureId}`)
  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(dirname(tempDir), { recursive: true })
  cpSync(sourceDir, tempDir, { recursive: true })
  return tempDir
}

function prepareDir(dir) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

function diffSizes(value, baseline) {
  return {
    raw: value.raw - baseline.raw,
    gzip: value.gzip - baseline.gzip,
    brotli: value.brotli - baseline.brotli,
  }
}

function printTable(title, headers, rows) {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => String(row[index]).length)),
  )

  const line = (cells) => cells.map((cell, index) => String(cell).padEnd(widths[index])).join('  ')

  console.log(`\n${title}`)
  console.log(line(headers))
  console.log(line(widths.map((width) => '-'.repeat(width))))
  for (const row of rows) {
    console.log(line(row))
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  return `${kb.toFixed(kb >= 10 ? 1 : 2)} kB`
}

function formatSignedBytes(bytes) {
  return bytes >= 0 ? `+${formatBytes(bytes)}` : `-${formatBytes(Math.abs(bytes))}`
}

function runCommand(command, commandArgs, options = {}) {
  try {
    return execFileSync(command, commandArgs, {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    })
  } catch (error) {
    const details = [error.stdout, error.stderr].filter(Boolean).join('\n')
    throw new Error(details || error.message)
  }
}
