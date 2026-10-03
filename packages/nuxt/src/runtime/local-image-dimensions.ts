/** Resolve public URL paths, including encoded filenames and an app base URL. */
export function createLocalImageDimensionsResolver(
  dimensions: Readonly<Record<string, readonly [number, number]>>,
  baseURL: string,
) {
  return (src: string): { width: number; height: number } | undefined => {
    if (/^(?:https?:|\/\/)/i.test(src)) return undefined
    let path = src.split(/[?#]/, 1)[0]!
    const prefix = baseURL.endsWith('/') ? baseURL : baseURL + '/'
    if (prefix !== '/' && path.startsWith(prefix)) path = '/' + path.slice(prefix.length)
    let size = Object.hasOwn(dimensions, path) ? dimensions[path] : undefined
    if (!size) {
      try {
        const decoded = decodeURI(path)
        size = Object.hasOwn(dimensions, decoded) ? dimensions[decoded] : undefined
      } catch {
        /* Malformed URI escapes are unknown sources. */
      }
    }
    return size ? { width: size[0], height: size[1] } : undefined
  }
}
