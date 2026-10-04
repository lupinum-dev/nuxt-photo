import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { LabSummary } from '../../lab/measurement'

const pages = [
  { name: 'rows', path: '/lab/album?layout=rows&n=200' },
  { name: 'columns', path: '/lab/album?layout=columns&columns=4&n=200' },
  { name: 'archive', path: '/lab/archive?n=1000' },
]
const profiles = [
  { name: 'none', latency: 0, download: -1, upload: -1 },
  { name: 'Fast 4G', latency: 40, download: 9_000_000 / 8, upload: 1_500_000 / 8 },
  { name: 'Slow 4G', latency: 150, download: 1_600_000 / 8, upload: 750_000 / 8 },
]
interface ResponseRecord {
  url: string
  method: string
  resourceType: string
  status: number
  bodyBytes: number
  headers: Record<string, string | null>
}
interface Run {
  browser: string
  page: string
  profile: string
  motion: string
  cache: string
  summary: LabSummary
  bytes: number
  transferBytes: number | null
  requestCount: number
  diagnosticRequestCount: number
  responses: ResponseRecord[]
  initialEnd: number
  finalPhotoCount: number
}
const evidence = resolve(
  process.env.LAB_EVIDENCE_DIR ?? 'test-results/scroll-wait',
  `baseline-${process.env.LAB_RUN_ID}`,
)

async function traverse(page: Page, motion: string, initialEnd: number) {
  if (motion === 'human') {
    // Freeze the requested archive's extent; end-reached may append while scrolling.
    // Those new photos remain live, but must not turn n=1000 into a moving target.
    let stalled = 0
    let steps = 0
    while (
      await page.evaluate(
        (end) => scrollY < Math.min(end, document.documentElement.scrollHeight - innerHeight) - 1,
        initialEnd,
      )
    ) {
      const before = await page.evaluate(() => scrollY)
      await page.mouse.wheel(0, 900)
      await page.waitForTimeout(600)
      const after = await page.evaluate(() => scrollY)
      stalled = after <= before ? stalled + 1 : 0
      if (stalled >= 3) throw new Error(`Scroll stalled at ${after}; initial end ${initialEnd}`)
      if (++steps % 25 === 0)
        process.stdout.write(`scroll ${Math.round(after)} / ${Math.round(initialEnd)}\n`)
    }
  } else {
    await page.evaluate(async () => {
      const start = performance.now()
      const from = scrollY
      await new Promise<void>((done) => {
        function step(time: number) {
          const progress = Math.min(1, (time - start) / 500)
          scrollTo(0, from + innerHeight * 5 * progress)
          if (progress < 1) requestAnimationFrame(step)
          else done()
        }
        requestAnimationFrame(step)
      })
    })
  }
}
async function run(
  context: BrowserContext,
  path: string,
  motion: string,
  profile: (typeof profiles)[number],
  metadata: Pick<Run, 'browser' | 'page' | 'cache'>,
): Promise<Run> {
  process.stdout.write(
    `${metadata.browser}/${metadata.page}/${profile.name}/${motion}/${metadata.cache}: start\n`,
  )
  const page = await context.newPage()
  page.on('pageerror', (error) => console.error(`Lab page error: ${error.message}`))
  if (metadata.browser === 'chromium') {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: profile.latency,
      downloadThroughput: profile.download,
      uploadThroughput: profile.upload,
    })
  }
  const responses: ResponseRecord[] = []
  const captures: Promise<void>[] = []
  page.on('response', (response) => {
    const request = response.request()
    if (!/\/(?:_ipx\/|_vercel\/image|lab\/|__lab_cold\/)/.test(response.url())) return
    captures.push(
      (async () => {
        const headers = await response.allHeaders()
        const body = request.method() === 'HEAD' ? null : await response.body().catch(() => null)
        responses.push({
          url: response.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          status: response.status(),
          bodyBytes: body?.byteLength ?? 0,
          headers: Object.fromEntries(
            ['x-vercel-cache', 'cache-control', 'age', 'x-cache'].map((key) => [
              key,
              headers[key] ?? null,
            ]),
          ),
        })
      })(),
    )
  })
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !!window.__lab, undefined, { timeout: 30_000 })
    const initialEnd = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollHeight - innerHeight),
    )
    process.stdout.write(`mounted; initial end ${Math.round(initialEnd)}\n`)
    await traverse(page, motion, initialEnd)
    process.stdout.write('traversal complete\n')
    // Include waits that outlast the flick. Timeouts remain pending in the JSON, not discarded.
    await page
      .waitForFunction(
        () => window.__lab!.summary().imageTimings.every((image) => !image.pending),
        undefined,
        { timeout: 30_000 },
      )
      .catch((error: unknown) => {
        if (!(error instanceof Error) || !error.message.includes('Timeout')) throw error
      })
    await page.waitForTimeout(300)
    const summary = await page.evaluate(() => window.__lab!.summary())
    // WebKit exposes bytes for some raw assets but not optimized images: a partial
    // sum would under-report transfer. Retain delivered bodies and mark transfer unavailable.
    const transferBytes =
      metadata.browser === 'webkit'
        ? null
        : await page.evaluate(() => {
            const images = (
              performance.getEntriesByType('resource') as PerformanceResourceTiming[]
            ).filter((entry) => entry.initiatorType === 'img')
            // Cached entries can have known body sizes and a genuinely zero transfer.
            if (
              !images.length ||
              images.every(
                (entry) => !entry.transferSize && !entry.encodedBodySize && !entry.decodedBodySize,
              )
            )
              return null
            return images.reduce((sum, entry) => sum + entry.transferSize, 0)
          })
    const finalPhotoCount = await page.locator('.np-album__item').count()
    process.stdout.write(`captured metrics; finishing ${captures.length} responses\n`)
    await Promise.all(captures)
    const imageResponses = responses.filter(
      (response) => response.resourceType === 'image' && response.method === 'GET',
    )
    expect(
      imageResponses.every((response) => response.status >= 200 && response.status < 400),
    ).toBe(true)
    expect(summary.imageTimings.length).toBeGreaterThan(0)
    return {
      ...metadata,
      profile: profile.name,
      motion,
      summary,
      bytes: imageResponses.reduce((sum, response) => sum + response.bodyBytes, 0),
      transferBytes,
      requestCount: imageResponses.length,
      diagnosticRequestCount: responses.filter((response) => response.method === 'HEAD').length,
      responses,
      initialEnd,
      finalPhotoCount,
    }
  } finally {
    await page.close()
  }
}
async function table() {
  const entries = (await readdir(evidence)).filter((name) => name.endsWith('.json'))
  const runs: Run[] = (
    await Promise.all(
      entries.map(
        async (name) => JSON.parse(await readFile(resolve(evidence, name), 'utf8')) as Run[],
      ),
    )
  ).flat()
  const rows = runs
    .filter((run) => run.cache !== 'prime')
    .map(
      (run) =>
        `| ${run.browser} | ${run.page} | ${run.profile} | ${run.motion} | ${run.cache} | ${run.summary.waitP50Ms.toFixed(1)} | ${run.summary.waitP95Ms.toFixed(1)} | ${run.summary.waitMaxMs.toFixed(1)} | ${run.summary.blankTotalMs.toFixed(1)} | ${run.bytes} | ${run.transferBytes ?? 'n/a'} | ${run.requestCount} |`,
    )
  const anomalies = runs
    .filter((run) => run.cache === 'warm')
    .flatMap((warm) => {
      const cold = runs.find(
        (run) =>
          run.cache === 'cold' &&
          run.browser === warm.browser &&
          run.page === warm.page &&
          run.profile === warm.profile &&
          run.motion === warm.motion,
      )
      if (!cold) return []
      return (['waitP50Ms', 'waitP95Ms', 'waitMaxMs'] as const).flatMap((metric) => {
        const baseline = cold.summary[metric]
        const measured = warm.summary[metric]
        if (measured <= baseline + Math.max(20, baseline * 0.1)) return []
        return [
          `- ${warm.browser}/${warm.page}/${warm.profile}/${warm.motion}: warm ${metric} ${measured.toFixed(1)} ms > cold ${baseline.toFixed(1)} ms (noise allowance max(20 ms, 10%)). Investigate caching/scheduling; no performance conclusion.`,
        ]
      })
    })
  await writeFile(
    resolve(evidence, 'table.md'),
    `# Scroll wait baseline\n\n1440×900@2; one worker; WebKit unthrottled only (no CDP). Warm is the second normal-URL traversal in the same context after a recorded prime traversal; cold has a fresh context and nonce sources. Archive stops at its initial n=1000 extent. Fast flick stops after five viewports. Blank is the sum of visible blank milliseconds across images, not wall-clock duration. Bytes are delivered GET image bodies (including cached bodies); transfer bytes use same-origin Resource Timing and include HTTP overhead. HEAD format diagnostics counted separately. GET counts include the Lab's currentSrc decode probes. WebKit transfer bytes are unavailable (optimized image byte fields return zero, while some raw assets expose partial sizes), shown as n/a, not a zero-byte network claim. Decode + animation frame approximates paint. Pending waits are included up to snapshot.\n\n| Browser | Page | Profile | Motion | Cache | p50 ms | p95 ms | Max ms | Blank ms | Body bytes | Transfer bytes | Requests |\n|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n\n## Anomalies\n\n${anomalies.join('\n') || 'None beyond the declared noise allowance.'}\n`,
  )
}

for (const scenario of pages)
  for (const profile of profiles)
    for (const motion of ['human', 'flick']) {
      // WebKit has no CDP equivalent: declare only the unthrottled tests for it.
      test(`${scenario.name} ${profile.name} ${motion}`, async ({ browser, browserName }, info) => {
        test.setTimeout(600_000)
        const options = {
          baseURL: info.project.use.baseURL,
          viewport: { width: 1440, height: 900 },
          deviceScaleFactor: 2,
        }
        const coldContext = await browser.newContext(options)
        let cold: Run
        try {
          cold = await run(coldContext, `${scenario.path}&cold=1`, motion, profile, {
            browser: browserName,
            page: scenario.name,
            cache: 'cold',
          })
        } finally {
          await coldContext.close()
        }
        const warmContext = await browser.newContext(options)
        let prime: Run, warm: Run
        try {
          prime = await run(warmContext, scenario.path, motion, profile, {
            browser: browserName,
            page: scenario.name,
            cache: 'prime',
          })
          warm = await run(warmContext, scenario.path, motion, profile, {
            browser: browserName,
            page: scenario.name,
            cache: 'warm',
          })
        } finally {
          await warmContext.close()
        }
        await mkdir(evidence, { recursive: true })
        await writeFile(
          resolve(evidence, `${browserName}-${scenario.name}-${profile.name}-${motion}.json`),
          JSON.stringify([cold, prime, warm], null, 2),
        )
        await table()
      })
    }
