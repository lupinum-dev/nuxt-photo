import { createServer } from 'node:net'

/** Concurrent fixtures search disjoint parts of the approved 47000–47099 range. */
export async function findFixturePort(start: 47000 | 47050 | 47060): Promise<number> {
  const end = start === 47000 ? 47050 : start === 47050 ? 47060 : 47100
  for (let port = start; port < end; port++) {
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
  throw new Error(`No free Nuxt fixture port in ${start}–${end - 1}`)
}
