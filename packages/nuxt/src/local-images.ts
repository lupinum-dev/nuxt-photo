import { readdir, stat, readFile, writeFile, mkdir, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { extname, join, relative, sep, dirname } from 'node:path'
import { imageSizeFromFile } from 'image-size/fromFile'

const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'])

/** Scan public assets without sending filesystem paths to the client. */
export interface LocalImage {
  width: number
  height: number
  placeholderSrc?: string
  _placeholderColor?: string
}

export async function readLocalImages(
  publicDir: string,
  logger: { warn: (message: string) => void },
  options: {
    rootDir?: string
    cacheDir?: string
    previews?: boolean
    clientManifest?: boolean
  } = {},
): Promise<Record<string, LocalImage>> {
  const require = createRequire(import.meta.url)
  // Minimal boundary type keeps sharp optional even in consumers without its declarations.
  interface SharpImage {
    rotate(): SharpImage
    resize(options: { width: number; withoutEnlargement: boolean }): SharpImage
    webp(options: { quality: number }): SharpImage
    toBuffer(): Promise<Buffer>
    stats(): Promise<{ channels: { mean: number }[] }>
  }
  let sharp: ((file: string | Buffer) => SharpImage) | undefined
  if (options.previews !== false) {
    try {
      const paths = [options.rootDir ?? publicDir, import.meta.dirname]
      // pnpm keeps IPX's optional sharp installation below Nuxt Image rather than at app root.
      for (const dependency of ['@nuxt/image', 'ipx']) {
        try {
          paths.push(dirname(require.resolve(dependency, { paths })))
        } catch {
          /* Optional dependency. */
        }
      }
      const path = require.resolve('sharp', { paths })
      sharp = (await import(pathToFileURL(path).href)).default
    } catch {
      logger.warn(
        'Local image previews need the optional sharp peer; no build-time placeholders were generated.',
      )
    }
  }
  const cacheDir =
    options.cacheDir ?? join(options.rootDir ?? publicDir, 'node_modules/.cache/nuxt-photo')
  const cacheFile = join(
    cacheDir,
    createHash('sha256')
      .update(publicDir + ':preview-colour-v1')
      .digest('hex') + '.json',
  )
  type Cached = { mtime: number; size: number; image: LocalImage }
  let cache: Record<string, Cached> = {}
  if (sharp) {
    try {
      cache = JSON.parse(await readFile(cacheFile, 'utf8'))
    } catch {
      /* A missing or stale cache is rebuilt. */
    }
  }
  const nextCache: Record<string, Cached> = {}
  const dimensions: Record<string, LocalImage> = Object.create(null)
  const unreadable: string[] = []
  const unpreviewable: string[] = []

  async function visit(directory: string, ancestors = new Set<string>()) {
    let entries
    try {
      const real = await realpath(directory)
      if (ancestors.has(real)) return
      ancestors = new Set([...ancestors, real])
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
      let info: { isDirectory(): boolean; isFile(): boolean } = entry
      if (entry.isSymbolicLink()) {
        try {
          info = await stat(path)
        } catch {
          unreadable.push(relative(publicDir, path))
          continue
        }
      }
      if (info.isDirectory()) {
        await visit(path, ancestors)
      } else if (info.isFile() && extensions.has(extname(entry.name).toLowerCase())) {
        const url = '/' + relative(publicDir, path).split(sep).join('/')
        try {
          const info = await stat(path)
          const cached = cache[url]
          if (sharp && cached?.mtime === info.mtimeMs && cached.size === info.size) {
            dimensions[url] = cached.image
            nextCache[url] = cached
            continue
          }
          const { width, height, orientation } = await imageSizeFromFile(path)
          if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            throw new Error('Invalid image dimensions')
          }
          const rotated = orientation && orientation >= 5 && orientation <= 8
          const image: LocalImage = {
            width: rotated ? height : width,
            height: rotated ? width : height,
          }
          if (sharp) {
            try {
              const preview = await sharp(path)
                .rotate()
                .resize({ width: 32, withoutEnlargement: true })
                .webp({ quality: 40 })
                .toBuffer()
              image.placeholderSrc = 'data:image/webp;base64,' + preview.toString('base64')
              const { channels } = await sharp(preview).stats()
              image._placeholderColor =
                '#' +
                channels
                  .slice(0, 3)
                  .map(({ mean }) => Math.round(mean).toString(16).padStart(2, '0'))
                  .join('')
            } catch {
              unpreviewable.push(url)
            }
          }
          dimensions[url] = image
          nextCache[url] = { mtime: info.mtimeMs, size: info.size, image }
        } catch {
          unreadable.push(url)
        }
      }
    }
  }

  await visit(publicDir)
  if (sharp && Object.keys(nextCache).length) {
    await mkdir(cacheDir, { recursive: true })
    await writeFile(cacheFile, JSON.stringify(nextCache))
  }
  if (unpreviewable.length)
    logger.warn(`Could not generate local image previews: ${unpreviewable.join(', ')}`)
  if (unreadable.length)
    logger.warn(`Could not read local image dimensions: ${unreadable.join(', ')}`)
  if (options.clientManifest && Object.keys(dimensions).length > 2000) {
    logger.warn(
      'localImages includes more than 2,000 images; the dimensions lookup increases the client bundle size.',
    )
  }
  return dimensions
}
