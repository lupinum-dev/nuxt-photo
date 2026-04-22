import { describe, expect, it } from 'vitest'
import { createLightboxEngine } from '../src/lightboxEngine'
import { createPhotoSet } from '@test-fixtures/photos'

describe('createLightboxEngine', () => {
  it('keeps activeIndex within bounds across commands', () => {
    const photos = createPhotoSet()
    const engine = createLightboxEngine({ photos })

    engine.setActiveIndex(99)
    expect(engine.getState().activeIndex).toBe(photos.length - 1)

    engine.setActiveIndex(-5)
    expect(engine.getState().activeIndex).toBe(0)

    engine.next()
    expect(engine.getState().activeIndex).toBe(1)

    engine.prev()
    expect(engine.getState().activeIndex).toBe(0)
  })

  it('tracks viewer lifecycle transitions explicitly', () => {
    const engine = createLightboxEngine({
      photos: createPhotoSet().slice(0, 2),
    })

    engine.open(1)
    expect(engine.getState().status).toBe('opening')
    expect(engine.getState().activeIndex).toBe(1)

    engine.markOpened()
    expect(engine.getState().status).toBe('open')

    engine.close()
    expect(engine.getState().status).toBe('closing')

    engine.markClosed()
    expect(engine.getState().status).toBe('closed')
    expect(engine.getState().gesturePhase).toBe('idle')
    expect(engine.getState().closeDragY).toBe(0)
  })

  it('maintains the active photo when photos are replaced', () => {
    const photos = createPhotoSet(4)
    const engine = createLightboxEngine({ photos })

    engine.open(2)
    engine.markOpened()

    const reordered = [photos[1]!, photos[3]!, photos[2]!, photos[0]!]
    engine.setPhotos(reordered)
    expect(engine.getState().activePhoto?.id).toBe(photos[2]!.id)
    expect(engine.getState().activeIndex).toBe(2)
  })

  it('notifies subscribers with immutable snapshots', () => {
    const engine = createLightboxEngine({
      photos: createPhotoSet().slice(0, 2),
    })
    const seen: number[] = []

    const unsubscribe = engine.subscribe((state) => {
      seen.push(state.activeIndex)
    })

    engine.open(1)
    engine.markOpened()
    unsubscribe()
    engine.close()

    expect(seen).toEqual([0, 1, 1])
  })
})
