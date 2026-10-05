/// <reference path="./folder-data.d.ts" />
import { defineEventHandler, getQuery } from 'h3'
import { manifest, baseURL } from '#nuxt-photo-folders'

export default defineEventHandler((event) => {
  const folder = getQuery(event).folder
  if (typeof folder !== 'string') return []
  const prefix = '/' + folder.replace(/^\/+|\/+$/g, '') + '/'
  return Object.entries(manifest)
    .filter(([src]) => src.startsWith(prefix) && !src.slice(prefix.length).includes('/'))
    .map(([src, image]) => ({
      ...image,
      src: baseURL + src,
      id: src.slice(1).replace(/\.[^/.]+$/, ''),
    }))
})
