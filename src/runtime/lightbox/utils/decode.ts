export function decodeImage(img: HTMLImageElement): Promise<HTMLImageElement | undefined> {
  if (typeof img.decode === 'function') {
    return img.decode().then(() => undefined as HTMLImageElement | undefined).catch(() => undefined)
  }
  if (img.complete) {
    return Promise.resolve(img)
  }
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}
