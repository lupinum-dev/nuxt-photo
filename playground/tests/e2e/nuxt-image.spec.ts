import { expect, test } from '@playwright/test'

test('nuxt image demo uses the explicit provider contract with clean local components', async ({
  page,
}) => {
  await page.goto('/nuxt-image')

  await expect(
    page.getByText(`nuxtPhoto.image.provider = 'nuxt-image'`),
  ).toBeVisible()
  await expect(page.locator('body')).toContainText('<PhotoAlbum')

  await page.locator('.np-photo[role="button"]').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 1')
})
