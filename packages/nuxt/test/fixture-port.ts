import { createServer } from 'node:net'

/** Each concurrent fixture searches a separate half of the approved port range. */
export async function findFixturePort(start: 47000 | 47050): Promise<number> {
  for (let port = start; port < start + 50; port++) {
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
  throw new Error(`No free Nuxt fixture port in ${start}–${start + 49}`)
}
