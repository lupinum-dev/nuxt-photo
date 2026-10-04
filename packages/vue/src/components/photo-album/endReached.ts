import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

export function useAlbumEndReached(length: () => number, emit: () => void) {
  const sentinel = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | undefined
  let armed = true
  function observe() {
    observer?.disconnect()
    if (!sentinel.value || typeof IntersectionObserver === 'undefined') return
    const current: IntersectionObserver = new IntersectionObserver(
      (entries) => {
        // Ignore records queued by the observer for an earlier collection.
        if (observer !== current) return
        if (armed && length() > 0 && entries.some((entry) => entry.isIntersecting)) {
          armed = false
          emit()
        }
      },
      { rootMargin: `0px 0px ${window.innerHeight}px 0px` },
    )
    observer = current
    current.observe(sentinel.value)
  }
  onMounted(() => {
    observe()
    window.addEventListener('resize', observe)
  })
  watch(
    length,
    async (count, previous) => {
      if (count <= previous) return
      armed = true
      await nextTick()
      observe()
    },
    { flush: 'post' },
  )
  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = undefined
    window.removeEventListener('resize', observe)
  })
  return sentinel
}
