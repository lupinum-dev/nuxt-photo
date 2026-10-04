/** IPX treats ?cold= as a local filename and returns 403. Keep a nonce in the
 * public source path; resolve it only inside Nitro, after the external cache key.
 * Nitro's relative $fetch is an internal call, not a request through the CDN.
 * IPX caches processing promises per invocation, not across requests.
 */
export default defineEventHandler(async (event) => {
  const match = event.path.match(/^\/_ipx\/([^/]+)\/__lab_cold\/[\w-]+\/(lab\/[^/?]+)$/)
  if (!match) return
  const response = await $fetch.raw(`/_ipx/${match[1]}/${match[2]}`, {
    responseType: 'arrayBuffer',
    headers: { accept: getHeader(event, 'accept') ?? '*/*' },
  })
  for (const name of ['content-type', 'cache-control', 'etag', 'last-modified', 'vary']) {
    const value = response.headers.get(name)
    if (value) setHeader(event, name, value)
  }
  return new Uint8Array(response._data!)
})
