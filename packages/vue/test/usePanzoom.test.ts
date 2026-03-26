// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { computeZoomLevels } from '@nuxt-photo/core'
import { usePanzoom } from '@nuxt-photo/vue'
import { createPhotoSet } from '@test-fixtures/photos'

describe('usePanzoom', () => {
  it('refreshes zoom state from the current photo and area metrics', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)

    panzoom.refreshZoomState(true)

    expect(panzoom.zoomState.value).toEqual(computeZoomLevels(1600, 1000, 1200, 800))
    expect(panzoom.panState.value).toEqual({ x: 0, y: 0 })
  })

  it('returns a centered pan target when zooming back to fit', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)

    panzoom.refreshZoomState(true)
    panzoom.setPanzoomImmediate(2, { x: 180, y: -90 })

    expect(panzoom.getTargetPanForZoom(panzoom.zoomState.value.fit, { x: 320, y: 240 })).toEqual({ x: 0, y: 0 })
  })

  it('clamps pan after recalculating geometry at the current zoom', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)

    panzoom.refreshZoomState(true)
    panzoom.setPanzoomImmediate(panzoom.zoomState.value.max, { x: 1000, y: -1000 })
    panzoom.refreshZoomState(false)

    const bounds = panzoom.getPanBounds(currentPhoto.value, panzoom.zoomState.value.max)
    expect(panzoom.panState.value).toEqual({ x: bounds.x, y: -bounds.y })
  })

  it('applies transforms to the active slide ref only', () => {
    const currentPhoto = computed(() => createPhotoSet()[0]!)
    const areaMetrics = ref({ left: 0, top: 0, width: 1200, height: 800 })
    const panzoom = usePanzoom(currentPhoto, areaMetrics)
    const inactive = document.createElement('div')
    const active = document.createElement('div')

    panzoom.setActiveSlideIndex(1)
    panzoom.setPanzoomImmediate(2, { x: 30, y: -40 })
    panzoom.setSlideZoomRef(0)(inactive)
    panzoom.setSlideZoomRef(1)(active)

    expect(inactive.style.transform).toBe('translate3d(0px, 0px, 0) scale(1)')
    expect(active.style.transform).toBe('translate3d(30px, -40px, 0) scale(2)')
  })
})
