import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

const execFileAsync = promisify(execFile)
const fixtureRoot = fileURLToPath(new URL('./fixtures/basic', import.meta.url))

describe('nuxt-photo module integration', async () => {
  await setup({
    rootDir: fixtureRoot,
  })

  it('renders the module surface in a real Nuxt app', async () => {
    const html = await $fetch('/')

    expect(html).toContain('id="nuxt-photo-min-zoom">1.2<')
    expect(html).toContain('Fixture sunrise')
    expect(html).toContain('class="np-scope')
  })

  it('type-checks fixture access to augmented app config', async () => {
    await execFileAsync('pnpm', ['exec', 'nuxi', 'prepare', fixtureRoot])
    await execFileAsync('pnpm', [
      'exec',
      'vue-tsc',
      '-p',
      `${fixtureRoot}/.nuxt/tsconfig.app.json`,
      '--noEmit',
    ])
  }, 30_000)
})
