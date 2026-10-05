import type { Plugin } from '#app'
import { defineNuxtPlugin } from '#imports'
import { installNuxtPhoto } from './install'

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  installNuxtPhoto(nuxtApp)
}
export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
