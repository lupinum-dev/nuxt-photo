import { defineConfig } from '@playwright/test'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const port = process.env.PLAYWRIGHT_PORT ?? '47019'
const baseURL = process.env.LAB_BASE_URL ?? `http://127.0.0.1:${port}`
process.env.LAB_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, '-')

export default defineConfig({
  testDir: '.',
  testMatch: 'scroll-wait.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 600_000,
  reporter: 'list',
  outputDir: resolve(
    process.env.LAB_EVIDENCE_DIR ?? 'test-results/scroll-wait',
    `playwright-${process.env.LAB_RUN_ID}`,
  ),
  use: { baseURL, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', grep: / none /, use: { browserName: 'webkit' } },
  ],
  ...(!process.env.LAB_BASE_URL && {
    webServer: {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      command: `PORT=${port} HOST=127.0.0.1 node .output/server/index.mjs`,
      url: baseURL,
      reuseExistingServer: false,
    },
  }),
})
