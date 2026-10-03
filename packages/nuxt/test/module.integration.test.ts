import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { findFixturePort } from './fixture-port'

const execFileAsync = promisify(execFile)
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const fixtureRoot = fileURLToPath(new URL('./fixtures/basic', import.meta.url))

describe('nuxt-photo module integration', async () => {
  await setup({
    rootDir: fixtureRoot,
    port: await findFixturePort(47000),
  })

  it('renders the module surface in a real Nuxt app', async () => {
    const html = await $fetch('/')

    expect(html).toContain('id="nuxt-photo-label">Fixture photo 3<')
    expect(html).toContain('Fixture sunrise')
    expect(html).toContain('aria-label="Fixture photo 2"')
    expect(html).toContain('np-scope-')
  })

  it('type-checks fixture access to the installed config API', async () => {
    const execOptions = { cwd: packageRoot }

    await execFileAsync('pnpm', ['exec', 'nuxi', 'prepare', fixtureRoot], execOptions)
    await execFileAsync(
      'pnpm',
      ['exec', 'vue-tsc', '-p', `${fixtureRoot}/.nuxt/tsconfig.app.json`, '--noEmit'],
      execOptions,
    )
  }, 30_000)
})
