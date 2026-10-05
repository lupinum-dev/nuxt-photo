import { onBeforeUnmount, ref, type Ref } from 'vue'

/** Retain the placeholder until decoded pixels can paint; ignore stale request completions. */
export function useImagePaint(imageRef: Ref<HTMLImageElement | null>) {
  const loaded = ref(false)
  const failed = ref(false)
  let version = 0
  function handleLoad() {
    const current = ++version
    const image = imageRef.value
    const decoded = image?.decode ? image.decode() : Promise.resolve()
    void decoded
      .then(() =>
        requestAnimationFrame(() => {
          if (current !== version) return
          loaded.value = true
          failed.value = false
        }),
      )
      .catch(() => {
        /* Keep the placeholder if decoding fails. */
      })
  }
  function handleError() {
    version++
    loaded.value = false
    failed.value = true
  }
  function resetRequestState() {
    version++
    loaded.value = false
    failed.value = false
    const image = imageRef.value
    if (image?.complete && image.naturalWidth > 0) handleLoad()
  }
  onBeforeUnmount(() => {
    version++
  })
  return { loaded, failed, handleLoad, handleError, resetRequestState }
}
