import { defineAsyncComponent } from 'vue'

export const PhotoImage = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoImage.vue'),
)

export const PhotoAlbum = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoAlbum.vue'),
)

export const PhotoGallery = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoGallery.vue'),
)

export const PhotoImg = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoImg.vue'),
)

export const PhotoLightbox = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoLightbox.vue'),
)

export const PhotoLightboxAlbum = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoLightboxAlbum.vue'),
)

export const PhotoLightboxImg = defineAsyncComponent(
  () => import('./app/components/NuxtPhotoLightboxImg.vue'),
)
