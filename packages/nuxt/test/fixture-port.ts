import { createServer } from 'node:net'

/** Concurrent fixtures search disjoint ports, relative to PLAYWRIGHT_PORT when set. */
export async function findFixturePort(start: 47000 | 47050 | 47060): Promise<number> {
  let first: number = start
  const base = process.env.PLAYWRIGHT_PORT
  if (base) {
    const offset = start === 47000 ? 5 : start === 47050 ? 6 : 7
    const port = Number(base) + offset
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid fixture port relative to PLAYWRIGHT_PORT: ${base}`)
    }
    first = port
  }
  const end = base ? first + 1 : start === 47000 ? 47050 : start === 47050 ? 47060 : 47100
  for (let port = first; port < end; port++) {
    const server = createServer()
    const available = await new Promise<boolean>((resolve, reject) => {
      server.once('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') resolve(false)
        else reject(error)
      })
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
    })
    if (available) return port
  }
  throw new Error(`No free Nuxt fixture port in ${first}–${end - 1}`)
}
