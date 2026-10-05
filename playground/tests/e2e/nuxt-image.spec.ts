import { expect, test } from './helpers'

test('nuxt image demo uses the automatic provider contract with clean local components', async ({
  request,
}) => {
  const response = await request.get('/nuxt-image')
  expect(response.ok()).toBe(true)
  const html = await response.text()

  expect(html).toContain('NuxtImage support')
  expect(html).toContain('Nuxt Image resolves image URLs')
  expect(html).toContain('&lt;PhotoAlbum&gt;')
  expect(html).toContain('src="/_ipx/w_1280&amp;q_80&amp;f_webp/photos/moss-canyon.jpg"')
})
