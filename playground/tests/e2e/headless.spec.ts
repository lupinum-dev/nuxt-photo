import { expect, test } from './helpers'

test('headless playground wiring works through useLightbox', async ({
  request,
}) => {
  const response = await request.get('/headless')
  expect(response.ok()).toBe(true)
  const html = await response.text()

  expect(html).toContain('Fully headless layout')
  expect(html.match(/class="hex-grid__item"/g)).toHaveLength(8)
  expect(html).toContain('alt="Desert landscape at golden hour"')
})
