// Starts `nuxt dev` in the current directory, requests one page and checks its server-rendered
// HTML. The dev server loads installed packages with Node unless Nuxt is told to transform
// them, so a package that ships files Node cannot read can pass `nuxt build` and still fail here.
//
// Usage: node dev-render.mjs <path> <text the HTML must contain>
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'

const [path, marker] = process.argv.slice(2)
if (!path || !marker) throw new Error('Usage: dev-render.mjs <path> <marker>')

const probe = createServer().listen(0, '127.0.0.1')
await once(probe, 'listening')
const { port } = probe.address()
probe.close()
await once(probe, 'close')

// Its own process group: `nuxt dev` forks, and the whole group must stop afterwards.
const dev = spawn('pnpm', ['exec', 'nuxt', 'dev', '--port', String(port), '--host', '127.0.0.1'], {
  stdio: ['ignore', 'inherit', 'inherit'],
  detached: true,
})
const exited = once(dev, 'exit')

try {
  const url = `http://127.0.0.1:${port}${path}`
  const deadline = Date.now() + 120_000
  let response
  while (!response && Date.now() < deadline) {
    if (dev.exitCode !== null) throw new Error(`nuxt dev exited with code ${dev.exitCode}.`)
    try {
      const attempt = await fetch(url)
      // 503 is the loading page while the dev server builds.
      if (attempt.status !== 503) response = attempt
    } catch {
      // Not listening yet.
    }
    if (!response) await new Promise((resolve) => setTimeout(resolve, 500))
  }
  if (!response) throw new Error(`nuxt dev did not answer ${url} within 120 s.`)

  const html = await response.text()
  if (response.status !== 200) {
    const reason = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 400)
    throw new Error(`nuxt dev answered ${path} with ${response.status}: ${reason}`)
  }
  if (!html.includes(marker))
    throw new Error(`nuxt dev rendered ${path} without ${JSON.stringify(marker)}.`)
  process.stdout.write(`nuxt dev rendered ${path} on the server\n`)
} finally {
  if (dev.pid !== undefined) {
    try {
      process.kill(-dev.pid, 'SIGTERM')
    } catch {
      // Already gone.
    }
  }
  await exited
}
