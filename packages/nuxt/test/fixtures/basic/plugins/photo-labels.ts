export default defineNuxtPlugin(() => {
  providePhotoLabels(() => ({ close: 'Close from plugin' }))
})
