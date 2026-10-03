import { defineNuxtPlugin, type Plugin } from '#app'
import { installNuxtPhoto } from './install'

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  installNuxtPhoto(nuxtApp)
}
export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
