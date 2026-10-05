import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { $fetch, setup, useTestContext } from '@nuxt/test-utils/e2e'
import { findFixturePort } from './fixture-port'

const rootDir = fileURLToPath(new URL('./fixtures/folder-images', import.meta.url))
describe('folder payload without a client manifest', async () => {
  await setup({ rootDir, port: await findFixturePort(47060) })
  it('SSR and prerender include only the requested folder with localImages disabled', async () => {
    const output = useTestContext().nuxt!.options.buildDir + '/output/public'
    const html = await $fetch<string>('/folder')
    expect(html).toContain('nested/constructor')
    const raw = await $fetch<string>('/folder/_payload.json', { responseType: 'text' })
    // Nuxt extracts prerender data into _payload.json rather than duplicating it in HTML.
    const prerenderHtml = await readFile(output + '/folder/index.html', 'utf8')
    expect(prerenderHtml).toContain('nested/constructor')
    const prerender = await readFile(output + '/folder/_payload.json', 'utf8')
    for (const source of [raw, prerender]) {
      const payload = JSON.stringify(JSON.parse(source))
      expect(payload).toContain('nested/constructor')
      expect(payload).toContain('nested/photo')
      expect(payload).toContain('data:image/webp;base64,')
      expect(payload).not.toContain('oriented.jpg')
      expect(payload).not.toContain('photo.jpg')
    }
    const directory = output + '/_nuxt'
    for (const file of await readdir(directory)) {
      if (!file.endsWith('.js')) continue
      expect(await readFile(directory + '/' + file, 'utf8')).not.toContain('oriented.jpg')
    }
  })
})
