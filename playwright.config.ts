import { defineConfig } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: './playground/tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
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
  ],
  webServer: {
    command: `cd playground && PORT=${port} HOST=127.0.0.1 node .output/server/index.mjs`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
