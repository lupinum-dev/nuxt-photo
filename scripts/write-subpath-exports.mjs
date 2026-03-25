import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const distDir = resolve(root, 'dist')

if (!existsSync(resolve(distDir, 'runtime', 'index.js'))) {
  throw new Error('Expected dist/runtime/index.js to exist before writing subpath exports.')
}

const files = new Map([
  ['img.mjs', `export { PhotoImage, PhotoImg, PhotoLightboxImg } from './runtime/index.js'\n`],
  ['img.d.mts', `export { PhotoImage, PhotoImg, PhotoLightboxImg } from './runtime/index.js'\nexport type * from './runtime/types.js'\n`],
  ['album.mjs', `export { PhotoAlbum, PhotoLightboxAlbum, usePhotoAlbumLayout } from './runtime/index.js'\n`],
  ['album.d.mts', `export { PhotoAlbum, PhotoLightboxAlbum, usePhotoAlbumLayout } from './runtime/index.js'\nexport type * from './runtime/types.js'\n`],
  ['lightbox.mjs', `export { PhotoGallery, PhotoLightbox, PhotoLightboxAlbum, PhotoLightboxImg, usePhotoGroup, usePhotoLightbox } from './runtime/index.js'\n`],
  ['lightbox.d.mts', `export { PhotoGallery, PhotoLightbox, PhotoLightboxAlbum, PhotoLightboxImg, usePhotoGroup, usePhotoLightbox } from './runtime/index.js'\nexport type * from './runtime/types.js'\n`],
])

for (const [filename, contents] of files) {
  writeFileSync(resolve(distDir, filename), contents)
}
