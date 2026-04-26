import { expect, test } from './helpers'

test('nuxt image demo uses the explicit provider contract with clean local components', async ({
  request,
}) => {
  const response = await request.get('/nuxt-image')
  expect(response.ok()).toBe(true)
  const html = await response.text()

  expect(html).toContain('NuxtImage support')
  expect(html).toContain('nuxtPhoto.image.provider = &#39;nuxt-image&#39;')
  expect(html).toContain('&lt;PhotoAlbum&gt;')
  expect(html).toContain('src="/_ipx/w_1280/')
})
