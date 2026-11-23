// Starts the Vite dev server of the Vue consumer in the current directory and follows every
// import of the app from `/src/main.ts`, the lazy ones included. All JavaScript of the Vue package
// must come from Vite's dependency pre-bundle: a file loaded from the package directory next to
// it is a second copy of module state, and `createPhoto` options then miss the components.
//
// Usage: node vite-dev-modules.mjs
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// The consumer's Vite, not the workspace's.
const require = createRequire(join(process.cwd(), 'package.json'))
const load = async (name) => (await import(pathToFileURL(require.resolve(name)).href)).default
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href)
const vue = await load('@vitejs/plugin-vue')

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'warn',
  plugins: [vue()],
  server: { host: '127.0.0.1', port: 0 },
})
await server.listen()

try {
  const origin = server.resolvedUrls.local[0].replace(/\/$/, '')
  const seen = new Set()
  const pending = ['/src/main.ts']
  const imports = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g
  while (pending.length > 0) {
    const url = pending.pop()
    if (seen.has(url)) continue
    seen.add(url)
    const response = await fetch(origin + url)
    if (!response.ok) throw new Error(`Vite dev answered ${response.status} for ${url}.`)
    for (const [, specifier] of (await response.text()).matchAll(imports)) {
      if (specifier.startsWith('/') || specifier.startsWith('.')) {
        pending.push(new URL(specifier, origin + url).pathname)
      }
    }
  }

  const loaded = [...seen]
  const bundled = loaded.filter((url) => url.includes('/.vite/deps/'))
  const unbundled = loaded.filter(
    (url) =>
      url.includes('/@lupinum/vue-photo/') &&
      !url.includes('/.vite/deps/') &&
      !url.endsWith('.css'),
  )
  if (!bundled.some((url) => url.includes('@lupinum_vue-photo'))) {
    throw new Error(`Vite dev did not pre-bundle @lupinum/vue-photo. Loaded:\n${loaded.join('\n')}`)
  }
  if (unbundled.length > 0) {
    throw new Error(
      `Vite dev loaded @lupinum/vue-photo files beside its pre-bundle:\n${unbundled.join('\n')}`,
    )
  }
  process.stdout.write(
    `vite dev loaded @lupinum/vue-photo from one pre-bundle (${loaded.length} modules)\n`,
  )
} finally {
  await server.close()
}
