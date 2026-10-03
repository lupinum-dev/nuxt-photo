import { readdir } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'
import { imageSizeFromFile } from 'image-size/fromFile'

const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'])

/** Scan public assets without sending filesystem paths to the client. */
export async function readLocalImageDimensions(
  publicDir: string,
  logger: { warn: (message: string) => void },
): Promise<Record<string, [number, number]>> {
  const dimensions: Record<string, [number, number]> = Object.create(null)
  const unreadable: string[] = []

  async function visit(directory: string) {
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch (error) {
      // An app does not have to create a public directory.
      if (directory === publicDir && (error as NodeJS.ErrnoException).code === 'ENOENT') return
      unreadable.push(relative(publicDir, directory) || '.')
      return
    }
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(path)
      } else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
        const url = '/' + relative(publicDir, path).split(sep).join('/')
        try {
          const { width, height, orientation } = await imageSizeFromFile(path)
          if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            throw new Error('Invalid image dimensions')
          }
          dimensions[url] =
            orientation && orientation >= 5 && orientation <= 8 ? [height, width] : [width, height]
        } catch {
          unreadable.push(url)
        }
      }
    }
  }

  await visit(publicDir)
  if (unreadable.length)
    logger.warn(`Could not read local image dimensions: ${unreadable.join(', ')}`)
  if (Object.keys(dimensions).length > 2000) {
    logger.warn(
      'localImages includes more than 2,000 images; the dimensions lookup increases the client bundle size.',
    )
  }
  return dimensions
}
