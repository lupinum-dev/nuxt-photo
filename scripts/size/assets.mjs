import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'

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
