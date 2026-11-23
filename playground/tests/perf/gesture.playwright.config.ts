import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

// Gesture lab: drives a phone profile and records every frame. Chromium gets real touch input
// through CDP; WebKit gets a mouse, because Playwright's WebKit cannot send touch moves.
const port = process.env.PLAYWRIGHT_PORT ?? '47021'
const baseURL = process.env.LAB_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: '.',
  testMatch: 'gesture-trace.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 600_000,
  reporter: 'list',
  use: { baseURL },
  projects: [
    { name: 'chromium', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'webkit', use: { ...devices['iPhone 13'], hasTouch: false, browserName: 'webkit' } },
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
