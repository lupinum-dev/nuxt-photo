#!/usr/bin/env tsx
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

type FeatureFlags = {
  img: boolean
  album: boolean
  lightbox: boolean
}

type Scenario = {
  name: string
  previousName?: string
  features: FeatureFlags
  body: string[]
  setup?: string
}

type ChunkInfo = {
  name: string
  type: 'js' | 'css'
  rawSize: number
  gzipSize: number
}

type ScenarioResult = {
  name: string
  previousName?: string
  features: FeatureFlags
  totalJs: { raw: number, gz: number }
  totalCss: { raw: number, gz: number }
  chunks: ChunkInfo[]
}

type PreviousSummary = Record<string, { totalJsGz: number, moduleJsGz: number, totalCssGz: number }>

const ROOT = resolve(import.meta.dirname, '..')
const PLAYGROUND = join(ROOT, 'playground')
const CONFIG_PATH = join(PLAYGROUND, 'nuxt.config.ts')
const BENCHMARK_PAGE = join(PLAYGROUND, 'pages', '__benchmark.vue')
const OUTPUT_DIR = join(PLAYGROUND, '.output', 'public', '_nuxt')
const REPORT_PATH = join(ROOT, 'scripts', 'benchmark-report.md')
const JSON_REPORT_PATH = join(ROOT, 'scripts', 'benchmark-report.json')

const originalConfig = readFileSync(CONFIG_PATH, 'utf8')
const originalBenchmarkPage = existsSync(BENCHMARK_PAGE) ? readFileSync(BENCHMARK_PAGE, 'utf8') : null
const previousReport = existsSync(REPORT_PATH) ? readFileSync(REPORT_PATH, 'utf8') : null

const scenarios: Scenario[] = [
  {
    name: 'img-base',
    previousName: 'only-img',
    features: { img: true, album: false, lightbox: false },
    body: [
      '<PhotoImg src="/test.jpg" alt="Test image" :width="1200" :height="900" caption="Base image" />',
    ],
  },
  {
    name: 'album-base',
    previousName: 'only-album',
    features: { img: false, album: true, lightbox: false },
    body: [
      '<PhotoAlbum :items="photos" layout="masonry" :columns="{ 0: 2 }" :spacing="{ 0: 12 }" :padding="0" />',
    ],
  },
  {
    name: 'lightbox-only',
    previousName: 'only-lightbox',
    features: { img: false, album: false, lightbox: true },
    body: [
      '<PhotoLightbox :items="lightboxItems" />',
    ],
  },
  {
    name: 'gallery-only',
    features: { img: false, album: false, lightbox: true },
    body: [
      '<PhotoGallery :items="lightboxItems" />',
    ],
  },
  {
    name: 'img-lightbox-wrapper',
    previousName: 'img+lightbox',
    features: { img: true, album: false, lightbox: true },
    body: [
      '<PhotoLightboxImg src="/test.jpg" alt="Wrapper image" caption="Wrapper image" :width="1200" :height="900" />',
    ],
  },
  {
    name: 'album-lightbox-wrapper',
    previousName: 'album+lightbox',
    features: { img: false, album: true, lightbox: true },
    body: [
      '<PhotoLightboxAlbum :items="photos" layout="masonry" :columns="{ 0: 2 }" :spacing="{ 0: 12 }" :padding="0" />',
    ],
  },
  {
    name: 'everything',
    previousName: 'everything',
    features: { img: true, album: true, lightbox: true },
    body: [
      '<PhotoImg src="/test.jpg" alt="Base image" :width="1200" :height="900" caption="Base image" />',
      '<PhotoAlbum :items="photos" layout="masonry" :columns="{ 0: 2 }" :spacing="{ 0: 12 }" :padding="0" />',
      '<PhotoLightboxImg src="/test-2.jpg" alt="Wrapper image" :width="1200" :height="900" />',
      '<PhotoLightboxAlbum :items="photos" layout="masonry" :columns="{ 0: 2 }" :spacing="{ 0: 12 }" :padding="0" />',
      '<PhotoGallery :items="lightboxItems" />',
      '<PhotoLightbox :items="lightboxItems" />',
    ],
  },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(2)} KB`
}

function parseSize(raw: string): number {
  if (raw === '0 B') {
    return 0
  }

  const match = raw.match(/^([+-]?\d+(?:\.\d+)?)\s(B|KB)$/)
  if (!match) {
    return 0
  }

  const value = Number(match[1])
  const unit = match[2]
  return unit === 'KB' ? Math.round(value * 1024) : Math.round(value)
}

function parsePreviousSummary(markdown: string | null): PreviousSummary {
  if (!markdown) {
    return {}
  }

  const summary: PreviousSummary = {}
  const lines = markdown.split('\n')
  let inSummary = false

  for (const line of lines) {
    if (line.trim() === '## Summary') {
      inSummary = true
      continue
    }

    if (inSummary && line.startsWith('## ')) {
      break
    }

    if (!inSummary || !line.startsWith('|') || line.includes('Scenario')) {
      continue
    }

    const cells = line.split('|').map(cell => cell.trim()).filter(Boolean)
    if (cells.length < 5 || cells[0] === '---') {
      continue
    }

    const [name, totalJs, moduleJs, totalCss] = cells
    if (!name || !totalJs || !moduleJs || !totalCss) {
      continue
    }

    summary[name] = {
      totalJsGz: parseSize(totalJs),
      moduleJsGz: parseSize(moduleJs),
      totalCssGz: parseSize(totalCss),
    }
  }

  return summary
}

function generateConfig(features: FeatureFlags): string {
  return `export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: false },
  compatibilityDate: 'latest',
  nuxtPhoto: {
    features: {
      img: ${features.img},
      album: ${features.album},
      lightbox: ${features.lightbox},
    },
  },
})
`
}

function generateBenchmarkPage(scenario: Scenario): string {
  return `<template>
  <div class="benchmark-page">
    ${scenario.body.join('\n    ')}
  </div>
</template>

<script setup lang="ts">
const photos = [
  { src: '/one.jpg', thumbnailSrc: '/one-thumb.jpg', caption: 'One', width: 1200, height: 900 },
  { src: '/two.jpg', thumbnailSrc: '/two-thumb.jpg', caption: 'Two', width: 900, height: 1200 },
  { src: '/three.jpg', thumbnailSrc: '/three-thumb.jpg', caption: 'Three', width: 1600, height: 1100 },
]

const lightboxItems = photos.map(item => ({
  ...item,
  id: item.src,
  msrc: item.thumbnailSrc,
  type: 'image' as const,
}))
</script>
`
}

function collectChunks(): ChunkInfo[] {
  const files = readdirSync(OUTPUT_DIR)
  return files
    .filter(file => file.endsWith('.js') || file.endsWith('.css'))
    .map<ChunkInfo>((file) => {
      const filePath = join(OUTPUT_DIR, file)
      const contents = readFileSync(filePath)
      return {
        name: file,
        type: file.endsWith('.css') ? 'css' : 'js',
        rawSize: statSync(filePath).size,
        gzipSize: gzipSync(contents).length,
      }
    })
    .sort((a, b) => b.gzipSize - a.gzipSize)
}

function sumSizes(chunks: ChunkInfo[], type: 'js' | 'css') {
  const selected = chunks.filter(chunk => chunk.type === type)
  return {
    raw: selected.reduce((sum, chunk) => sum + chunk.rawSize, 0),
    gz: selected.reduce((sum, chunk) => sum + chunk.gzipSize, 0),
  }
}

function buildScenario(scenario: Scenario): ScenarioResult {
  writeFileSync(CONFIG_PATH, generateConfig(scenario.features))
  writeFileSync(BENCHMARK_PAGE, generateBenchmarkPage(scenario))
  rmSync(join(PLAYGROUND, '.output'), { force: true, recursive: true })

  execFileSync('npx', ['nuxt', 'build'], {
    cwd: PLAYGROUND,
    stdio: 'pipe',
    timeout: 180_000,
  })

  const chunks = collectChunks()

  return {
    name: scenario.name,
    previousName: scenario.previousName,
    features: scenario.features,
    totalJs: sumSizes(chunks, 'js'),
    totalCss: sumSizes(chunks, 'css'),
    chunks,
  }
}

function createComparisonLines(results: ScenarioResult[], previous: PreviousSummary): string[] {
  const lines: string[] = []
  const comparable = results.filter(result => result.previousName && previous[result.previousName])

  if (comparable.length === 0) {
    return lines
  }

  lines.push('## Comparison vs Previous Report')
  lines.push('')
  lines.push('| Scenario | Previous Total JS (gz) | Current Total JS (gz) | Delta |')
  lines.push('|---|---|---|---|')

  for (const result of comparable) {
    const previousName = result.previousName
    if (!previousName) {
      continue
    }

    const previousEntry = previous[previousName]
    if (!previousEntry) {
      continue
    }

    const delta = result.totalJs.gz - previousEntry.totalJsGz
    const sign = delta >= 0 ? '+' : ''
    lines.push(`| ${result.name} | ${formatSize(previousEntry.totalJsGz)} | ${formatSize(result.totalJs.gz)} | ${sign}${formatSize(delta)} |`)
  }

  lines.push('')
  return lines
}

function generateReport(results: ScenarioResult[], previous: PreviousSummary): string {
  const lines: string[] = []
  const generatedAt = new Date().toISOString()
  const baseline = results.find(result => result.name === 'everything')

  lines.push('# nuxt-photo Bundle Size Report')
  lines.push('')
  lines.push(`Generated: ${generatedAt}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Scenario | Total JS (gz) | Total CSS (gz) |')
  lines.push('|---|---|---|')

  for (const result of results) {
    lines.push(`| ${result.name} | ${formatSize(result.totalJs.gz)} | ${formatSize(result.totalCss.gz)} |`)
  }

  lines.push('')

  if (baseline) {
    lines.push('## Delta from Everything')
    lines.push('')
    lines.push('| Scenario | JS Delta (gz) | CSS Delta (gz) |')
    lines.push('|---|---|---|')

    for (const result of results) {
      if (result.name === baseline.name) {
        continue
      }

      const jsDelta = result.totalJs.gz - baseline.totalJs.gz
      const cssDelta = result.totalCss.gz - baseline.totalCss.gz
      const jsSign = jsDelta >= 0 ? '+' : ''
      const cssSign = cssDelta >= 0 ? '+' : ''
      lines.push(`| ${result.name} | ${jsSign}${formatSize(jsDelta)} | ${cssSign}${formatSize(cssDelta)} |`)
    }

    lines.push('')
  }

  lines.push(...createComparisonLines(results, previous))

  lines.push('## Top Chunks')
  lines.push('')

  for (const result of results) {
    lines.push(`### ${result.name}`)
    lines.push('')
    lines.push('| Chunk | Type | Raw | Gzipped |')
    lines.push('|---|---|---|---|')

    for (const chunk of result.chunks.slice(0, 8)) {
      lines.push(`| ${chunk.name} | ${chunk.type} | ${formatSize(chunk.rawSize)} | ${formatSize(chunk.gzipSize)} |`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

function restoreFiles() {
  writeFileSync(CONFIG_PATH, originalConfig)

  if (originalBenchmarkPage === null) {
    rmSync(BENCHMARK_PAGE, { force: true })
    return
  }

  mkdirSync(join(PLAYGROUND, 'pages'), { recursive: true })
  writeFileSync(BENCHMARK_PAGE, originalBenchmarkPage)
}

async function main() {
  const previousSummary = parsePreviousSummary(previousReport)
  const results: ScenarioResult[] = []

  try {
    for (const scenario of scenarios) {
      console.log(`Building benchmark scenario: ${scenario.name}`)
      results.push(buildScenario(scenario))
    }
  }
  finally {
    restoreFiles()
  }

  const report = generateReport(results, previousSummary)
  writeFileSync(REPORT_PATH, report)
  writeFileSync(JSON_REPORT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2))
  console.log(`Wrote ${REPORT_PATH}`)
  console.log(`Wrote ${JSON_REPORT_PATH}`)
}

void main().catch((error) => {
  restoreFiles()
  console.error(error)
  process.exitCode = 1
})
