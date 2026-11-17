import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { pathToFileURL } from 'node:url'

/**
 * Totals of what a Nuxt page loads before any interaction: the client entry, its static
 * imports and their CSS, read from the build's client manifest. Dynamic imports stay out.
 */
export async function collectEagerAssets(nuxtDir) {
  const manifestUrl = pathToFileURL(join(nuxtDir, '.nuxt', 'dist', 'server', 'client.manifest.mjs'))
  const manifest = (await import(manifestUrl.href)).default
  const keys = Object.keys(manifest).filter((key) => manifest[key].isEntry)
  const files = new Set()
  for (const key of keys) {
    const entry = manifest[key]
    files.add(entry.file)
    for (const css of entry.css ?? []) files.add(css)
    for (const imported of entry.imports ?? []) if (!keys.includes(imported)) keys.push(imported)
  }
  if (files.size === 0) throw new Error(`No client entry in the manifest of ${nuxtDir}.`)
  const publicDir = join(nuxtDir, '.output', 'public', '_nuxt')
  return [...files]
    .map((file) => sizeBuffer(readFileSync(join(publicDir, file))))
    .reduce(
      (sum, file) => ({
        raw: sum.raw + file.raw,
        gzip: sum.gzip + file.gzip,
        brotli: sum.brotli + file.brotli,
      }),
      { raw: 0, gzip: 0, brotli: 0 },
    )
}

export function collectAssets(dir) {
  const files = []
  walk(dir, (file) => {
    const extension = extname(file)
    if (extension !== '.js' && extension !== '.css') return
    const relativePath = relative(dir, file)
    const contents = readFileSync(file)
    files.push({
      file: relativePath,
      ...sizeBuffer(contents),
    })
  })

  if (files.length === 0) throw new Error(`No JavaScript or CSS build assets found in ${dir}.`)
  const totals = files.reduce(
    (sum, file) => ({
      raw: sum.raw + file.raw,
      gzip: sum.gzip + file.gzip,
      brotli: sum.brotli + file.brotli,
    }),
    { raw: 0, gzip: 0, brotli: 0 },
  )

  return { totals, files }
}

function walk(dir, onFile) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, onFile)
    } else {
      onFile(fullPath)
    }
  }
}

function sizeBuffer(buffer) {
  return {
    raw: buffer.byteLength,
    gzip: gzipSync(buffer).byteLength,
    brotli: brotliCompressSync(buffer).byteLength,
  }
}
