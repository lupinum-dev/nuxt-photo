// @vitest-environment jsdom

import EmblaCarousel from 'embla-carousel'
import { describe, expect, it } from 'vitest'
import { createCarouselGroups } from '../../src/integrations/embla/groups'

function setRect(
  element: HTMLElement,
  rect: { left: number; top?: number; width: number; height?: number },
) {
  const values = {
    offsetLeft: rect.left,
    offsetTop: rect.top ?? 0,
    offsetWidth: rect.width,
    offsetHeight: rect.height ?? 400,
  }
  for (const [name, value] of Object.entries(values)) {
    Object.defineProperty(element, name, { configurable: true, value })
  }
}

describe('canonical carousel groups', () => {
  it('uses one deterministic model for snaps and slides', () => {
    expect(createCarouselGroups(5, 2)).toEqual({
      slidesBySnap: [[0, 1], [2, 3], [4]],
      snapBySlide: { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2 },
    })
  })

  it('normalizes invalid group sizes without vendor state', () => {
    expect(createCarouselGroups(2, Number.NaN).slidesBySnap).toEqual([[0], [1]])
    expect(createCarouselGroups(2, 8).slidesBySnap).toEqual([[0, 1]])
  })

  it('matches real Embla 9 selection using only its public API', () => {
    class NoopObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    window.IntersectionObserver =
      NoopObserver as unknown as typeof window.IntersectionObserver
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia

    const root = document.createElement('div')
    const container = document.createElement('div')
    const slides = Array.from({ length: 5 }, (_, index) => {
      const slide = document.createElement('div')
      setRect(slide, { left: index * 300, width: 300 })
      return slide
    })
    setRect(root, { left: 0, width: 600 })
    setRect(container, { left: 0, width: 600 })
    container.append(...slides)
    root.append(container)
    document.body.append(root)

    const groups = createCarouselGroups(slides.length, 2)
    const api = EmblaCarousel(root, {
      align: 'start',
      containScroll: 'trimSnaps',
      slidesToScroll: 2,
      resize: false,
      slideChanges: false,
    })

    expect(api.snapList()).toHaveLength(groups.slidesBySnap.length)
    api.goTo(1, true)
    expect(api.selectedSnap()).toBe(1)
    expect(groups.slidesBySnap[api.selectedSnap()]).toEqual([2, 3])

    api.reInit()
    expect(api.selectedSnap()).toBe(1)
    expect(groups.slidesBySnap[api.selectedSnap()]).toEqual([2, 3])

    api.destroy()
    root.remove()
  })
})
