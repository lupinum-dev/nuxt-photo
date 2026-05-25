import { defineConfig, devices } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '45173'

export default defineConfig({
  testDir: './playground/tests/e2e',
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'mobile-chromium',
      grep: /touch gestures|recipe gallery opens/,
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
      },
    },
    {
      name: 'firefox-smoke',
      grep: /recipe gallery opens/,
      use: {
        browserName: 'firefox',
      },
    },
    {
      name: 'webkit-smoke',
      grep: /recipe gallery opens/,
      use: {
        browserName: 'webkit',
      },
    },
  ],
  webServer: {
    command: `cd playground && PORT=${port} HOST=127.0.0.1 node .output/server/index.mjs`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
