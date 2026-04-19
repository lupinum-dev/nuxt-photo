import { build as esbuildBuild } from 'esbuild'
import { build as viteBuild } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import limits from './config.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..', '..')
const fixturesRoot = resolve(root, 'test', 'size')
const resultsRoot = resolve(root, 'test-results', 'size')
const analyzeRoot = resolve(root, 'test-results', 'size-analyze')
const nuxiBin = resolve(root, 'node_modules', '.bin', 'nuxi')
const sizeLimitBin = resolve(root, 'node_modules', '.bin', 'size-limit')

const args = process.argv.slice(2)
const analyze = args.includes('--analyze')
const target = ['core', 'vue', 'nuxt'].find(arg => args.includes(arg)) ?? 'all'

const coreScenarios = [
  {
    id: 'responsive',
    name: 'core:responsive',
    source: "import { responsive } from '@nuxt-photo/core'; console.log(responsive)",
  },
  {
    id: 'all',
    name: 'core:all',
    source: "import * as core from '@nuxt-photo/core'; console.log(core)",
  },
]

const vueScenarios = [
  { id: 'use-lightbox', name: 'vue:use-lightbox' },
  { id: 'photo-image', name: 'vue:photo-image' },
  { id: 'all', name: 'vue:all' },
]

const nuxtScenarios = [
  { id: 'baseline', name: 'nuxt:baseline' },
  { id: 'module', name: 'nuxt:module' },
  { id: 'usage', name: 'nuxt:usage' },
]

main()

async function main() {
  prepareDir(resultsRoot)
  if (analyze) prepareDir(analyzeRoot)

  ensureBuild(target)

  let sizeLimitResults = new Map()
  if (target === 'all' || target === 'core') {
    sizeLimitResults = runSizeLimit()
  }

  const failures = []

  if (target === 'all' || target === 'core') {
    const rows = []
    for (const scenario of coreScenarios) {
      const result = await measureCoreScenario(scenario)
      const sizeLimitResult = sizeLimitResults.get(scenario.name)
      const passed = sizeLimitResult?.passed ?? result.brotli <= limits.core[scenario.id].brotliLimit
      if (!passed) failures.push(scenario.name)
      rows.push({
        scenario: limits.core[scenario.id].label,
        raw: formatBytes(result.raw),
        gzip: formatBytes(result.gzip),
        brotli: formatBytes(result.brotli),
        limit: formatBytes(limits.core[scenario.id].brotliLimit),
        status: passed ? 'PASS' : 'FAIL',
      })
    }
    printTable('Core', ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Limit(br)', 'Status'], rows.map(row => [
      row.scenario,
      row.raw,
      row.gzip,
      row.brotli,
      row.limit,
      row.status,
    ]))
  }

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
    const moduleResult = measured.get('module')
    const usageResult = measured.get('usage')

    const moduleDelta = diffSizes(moduleResult, baseline)
    const usageDelta = diffSizes(usageResult, baseline)
    const modulePassed = moduleDelta.brotli <= limits.nuxt.module.brotliDeltaLimit
    const usagePassed = usageDelta.brotli <= limits.nuxt.usage.brotliDeltaLimit

    if (!modulePassed) failures.push('nuxt:module')
    if (!usagePassed) failures.push('nuxt:usage')

    printTable('Nuxt', ['Scenario', 'Raw', 'Gzip', 'Brotli', 'Delta(br)', 'Limit(br)', 'Status'], [
      [
        'baseline build',
        formatBytes(baseline.raw),
        formatBytes(baseline.gzip),
        formatBytes(baseline.brotli),
        '-',
        '-',
        'BASELINE',
      ],
      [
        limits.nuxt.module.label,
        formatBytes(moduleResult.raw),
        formatBytes(moduleResult.gzip),
        formatBytes(moduleResult.brotli),
        formatSignedBytes(moduleDelta.brotli),
        formatBytes(limits.nuxt.module.brotliDeltaLimit),
        modulePassed ? 'PASS' : 'FAIL',
      ],
      [
        limits.nuxt.usage.label,
        formatBytes(usageResult.raw),
        formatBytes(usageResult.gzip),
        formatBytes(usageResult.brotli),
        formatSignedBytes(usageDelta.brotli),
        formatBytes(limits.nuxt.usage.brotliDeltaLimit),
        usagePassed ? 'PASS' : 'FAIL',
      ],
    ])
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
    core: ['@nuxt-photo/core'],
    vue: ['@nuxt-photo/core', '@nuxt-photo/vue'],
    nuxt: ['@nuxt-photo/core', '@nuxt-photo/vue', '@nuxt-photo/recipes', '@nuxt-photo/nuxt'],
  }

  for (const pkg of buildSets[surface]) {
    runCommand('pnpm', ['--filter', pkg, 'build'])
  }
}

function runSizeLimit() {
  const stdout = execFileSync(sizeLimitBin, ['--json'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  })

  const parsed = JSON.parse(stdout)
  const results = new Map()
  for (const entry of parsed) {
    results.set(entry.name, entry)
  }
  return results
}

async function measureCoreScenario(scenario) {
  const result = await esbuildBuild({
    stdin: {
      contents: scenario.source,
      resolveDir: root,
      sourcefile: `${scenario.id}.ts`,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    treeShaking: true,
    minify: true,
    write: false,
    metafile: analyze,
  })

  const output = result.outputFiles[0].contents

  if (analyze && result.metafile) {
    writeFileSync(resolve(analyzeRoot, `${scenario.name}.metafile.json`), JSON.stringify(result.metafile, null, 2))
  }

  return sizeBuffer(output)
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
      analyze ? visualizer({ filename: analyzerFile, gzipSize: true, brotliSize: true, open: false, template: 'treemap' }) : null,
    ].filter(Boolean),
    resolve: {
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
    writeFileSync(resolve(analyzeRoot, `vite-${fixtureId}.assets.json`), JSON.stringify(assets.files, null, 2))
  }
  return assets.totals
}

function runNuxtFixture(fixtureId) {
  const tempDir = prepareFixture('nuxt', fixtureId)
  runCommand(nuxiBin, ['build'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NUXT_TELEMETRY_DISABLED: '1',
    },
  })
  const assets = collectAssets(resolve(tempDir, '.output', 'public', '_nuxt'))
  if (analyze) {
    writeFileSync(resolve(analyzeRoot, `nuxt-${fixtureId}.assets.json`), JSON.stringify(assets.files, null, 2))
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

function collectAssets(dir) {
  const files = []
  walk(dir, file => {
    const extension = extname(file)
    if (extension !== '.js' && extension !== '.css') return
    const relativePath = relative(dir, file)
    const contents = readFileSync(file)
    files.push({
      file: relativePath,
      ...sizeBuffer(contents),
    })
  })

  const totals = files.reduce((sum, file) => ({
    raw: sum.raw + file.raw,
    gzip: sum.gzip + file.gzip,
    brotli: sum.brotli + file.brotli,
  }), { raw: 0, gzip: 0, brotli: 0 })

  return { totals, files }
}

function walk(dir, onFile) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, onFile)
    } else {
      onFile(fullPath)
    }
  }
}

function sizeBuffer(buffer) {
  return {
    raw: buffer.byteLength,
    gzip: gzipSync(buffer).byteLength,
    brotli: brotliCompressSync(buffer).byteLength,
  }
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
    Math.max(header.length, ...rows.map(row => String(row[index]).length)))

  const line = (cells) => cells.map((cell, index) => String(cell).padEnd(widths[index])).join('  ')

  console.log(`\n${title}`)
  console.log(line(headers))
  console.log(line(widths.map(width => '-'.repeat(width))))
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
