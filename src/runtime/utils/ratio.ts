export type RatioSize = {
  width: number
  height: number
}

export function ratio({ width, height }: RatioSize) {
  return width / height
}
