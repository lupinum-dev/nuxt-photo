// The module generates '#nuxt-photo-folders' at build time. App typechecks include this file
// without the package tsconfig, so only this reference brings in its declaration.
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="./folder-data.d.ts" />
import { defineEventHandler, getQuery } from 'h3'
import { manifest, baseURL } from '#nuxt-photo-folders'
import { trimFolderSlashes } from '../trimFolderSlashes'

export default defineEventHandler((event) => {
  const folder = getQuery(event).folder
  if (typeof folder !== 'string') return []
  const prefix = '/' + trimFolderSlashes(folder) + '/'
  return Object.entries(manifest)
    .filter(([src]) => src.startsWith(prefix) && !src.slice(prefix.length).includes('/'))
    .map(([src, image]) => ({
      ...image,
      src: baseURL + src,
      id: src.slice(1).replace(/\.[^/.]+$/, ''),
    }))
})
