import type { Plugin } from 'vue'
import type { PhotoConfig } from './index'
import { installPhotoConfig } from './install'
import { validatePhotoConfig } from './validate'

/** Validate the plain Vue boundary before installing its reactive configuration. */
export function createPhoto(config: PhotoConfig): Plugin {
  validatePhotoConfig(config)
  return { install: (app) => installPhotoConfig(app, config) }
}
