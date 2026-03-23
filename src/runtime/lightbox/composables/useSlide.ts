/**
 * Builds slide instances around already-defined content objects.
 * Placeholder creation and content loading live in `useSlideContent.ts`.
 */
import {
  createElement,
  setTransform,
  toTransformString,
} from '../utils/dom'
import { clamp, equalizePoints, roundPoint } from '../utils/math'
import type {
  Axis,
  ContentInstance,
  LightboxInstance,
  LightboxItem,
  Point,
  SlideInstance,
} from '../types'
import { createPanBounds } from './createPanBounds'
import { getPanAreaSize } from './useViewportSize'
import { createZoomLevel } from './createZoomLevel'

export function useSlide(
  data: LightboxItem,
  index: number,
  lightbox: LightboxInstance,
): SlideInstance {
  const isActive = index === lightbox.currIndex
  const isFirstSlide = isActive && !lightbox.opener.isOpen

  const zoomLevels = createZoomLevel(lightbox.options, data, index, lightbox)

  lightbox.dispatch('gettingData', { slide: undefined, data, index })

  const container = createElement('photo-lightbox__zoom-wrap', 'div')

  const slide: SlideInstance = {
    data,
    index,
    lightbox,
    isActive,
    currentResolution: 0,
    panAreaSize: { x: 0, y: 0 },
    pan: { x: 0, y: 0 },
    isFirstSlide,
    zoomLevels,
    content: null as unknown as ContentInstance,
    container,
    holderElement: null,
    currZoomLevel: 1,
    width: 0,
    height: 0,
    heavyAppended: false,
    bounds: null as unknown as ReturnType<typeof createPanBounds>,
    prevDisplayedWidth: -1,
    prevDisplayedHeight: -1,

    setIsActive(active: boolean) {
      if (active && !this.isActive) {
        this.activate()
      }
      else if (!active && this.isActive) {
        this.deactivate()
      }
    },

    append(holderElement: HTMLElement) {
      this.holderElement = holderElement
      this.container.style.transformOrigin = '0 0'
      if (!this.data) return

      this.calculateSize()
      this.load()
      this.updateContentSize()
      this.appendHeavy()

      this.holderElement.appendChild(this.container)
      this.zoomAndPanToInitial()

      this.lightbox.dispatch('firstZoomPan', { slide: this })
      this.applyCurrentZoomPan()
      this.lightbox.dispatch('afterSetContent', { slide: this })

      if (this.isActive) this.activate()
    },

    load() {
      this.content.load(false)
      this.lightbox.dispatch('slideLoad', { slide: this })
    },

    appendHeavy() {
      const appendHeavyNearby = true
      if (
        this.heavyAppended
        || !this.lightbox.opener.isOpen
        || this.lightbox.mainScroll.isShifted()
        || (!this.isActive && !appendHeavyNearby)
      ) return

      if (this.lightbox.dispatch('appendHeavy', { slide: this }).defaultPrevented) return

      this.heavyAppended = true
      this.content.append()
      this.lightbox.dispatch('appendHeavyContent', { slide: this })
    },

    activate() {
      this.isActive = true
      this.appendHeavy()
      this.content.activate()
      this.lightbox.dispatch('slideActivate', { slide: this })
    },

    deactivate() {
      this.isActive = false
      this.content.deactivate()
      if (this.currZoomLevel !== this.zoomLevels.initial) {
        this.calculateSize()
      }
      this.currentResolution = 0
      this.zoomAndPanToInitial()
      this.applyCurrentZoomPan()
      this.updateContentSize()
      this.lightbox.dispatch('slideDeactivate', { slide: this })
    },

    destroy() {
      this.content.hasSlide = false
      this.content.remove()
      this.container.remove()
      this.lightbox.dispatch('slideDestroy', { slide: this })
    },

    resize() {
      if (this.currZoomLevel === this.zoomLevels.initial || !this.isActive) {
        this.calculateSize()
        this.currentResolution = 0
        this.zoomAndPanToInitial()
        this.applyCurrentZoomPan()
        this.updateContentSize()
      }
      else {
        this.calculateSize()
        this.bounds.update(this.currZoomLevel)
        this.panTo(this.pan.x, this.pan.y)
      }
    },

    updateContentSize(force?: boolean) {
      const scaleMultiplier = this.currentResolution || this.zoomLevels.initial
      if (!scaleMultiplier) return

      const width = Math.round(this.width * scaleMultiplier) || this.lightbox.viewportSize.x
      const height = Math.round(this.height * scaleMultiplier) || this.lightbox.viewportSize.y

      if (!this.sizeChanged(width, height) && !force) return
      this.content.setDisplayedSize(width, height)
    },

    sizeChanged(width: number, height: number): boolean {
      if (width !== this.prevDisplayedWidth || height !== this.prevDisplayedHeight) {
        this.prevDisplayedWidth = width
        this.prevDisplayedHeight = height
        return true
      }
      return false
    },

    getPlaceholderElement() {
      return this.content.placeholder?.element
    },

    zoomTo(destZoomLevel: number, centerPoint?: Point, transitionDuration?: number | false, ignoreBounds?: boolean) {
      if (!this.isZoomable() || this.lightbox.mainScroll.isShifted()) return

      this.lightbox.dispatch('beforeZoomTo', { destZoomLevel, centerPoint, transitionDuration })
      this.lightbox.animations.stopAllPan()

      const prevZoomLevel = this.currZoomLevel
      if (!ignoreBounds) {
        destZoomLevel = clamp(destZoomLevel, this.zoomLevels.min, this.zoomLevels.max)
      }

      this.setZoomLevel(destZoomLevel)
      this.pan.x = this.calculateZoomToPanOffset('x', centerPoint, prevZoomLevel)
      this.pan.y = this.calculateZoomToPanOffset('y', centerPoint, prevZoomLevel)
      roundPoint(this.pan)

      const finishTransition = () => {
        this._setResolution(destZoomLevel)
        this.applyCurrentZoomPan()
      }

      if (!transitionDuration) {
        finishTransition()
      }
      else {
        this.lightbox.animations.startTransition({
          isPan: true,
          name: 'zoomTo',
          target: this.container,
          transform: this.getCurrentTransform(),
          onComplete: finishTransition,
          duration: transitionDuration as number,
          easing: this.lightbox.options.easing,
        })
      }
    },

    toggleZoom(centerPoint?: Point) {
      this.zoomTo(
        this.currZoomLevel === this.zoomLevels.initial
          ? this.zoomLevels.secondary
          : this.zoomLevels.initial,
        centerPoint,
        this.lightbox.options.zoomAnimationDuration as number,
      )
    },

    setZoomLevel(currZoomLevel: number) {
      this.currZoomLevel = currZoomLevel
      this.bounds.update(this.currZoomLevel)
    },

    calculateZoomToPanOffset(axis: Axis, point?: Point, prevZoomLevel?: number): number {
      const totalPanDistance = this.bounds.max[axis] - this.bounds.min[axis]
      if (totalPanDistance === 0) return this.bounds.center[axis]

      if (!point) point = this.lightbox.getViewportCenterPoint()
      if (!prevZoomLevel) prevZoomLevel = this.zoomLevels.initial

      const zoomFactor = this.currZoomLevel / prevZoomLevel
      return this.bounds.correctPan(
        axis,
        (this.pan[axis] - point[axis]) * zoomFactor + point[axis],
      )
    },

    panTo(panX: number, panY: number) {
      this.pan.x = this.bounds.correctPan('x', panX)
      this.pan.y = this.bounds.correctPan('y', panY)
      this.applyCurrentZoomPan()
    },

    isPannable(): boolean {
      return Boolean(this.width) && this.currZoomLevel > this.zoomLevels.fit
    },

    isZoomable(): boolean {
      return Boolean(this.width) && this.content.isZoomable()
    },

    applyCurrentZoomPan() {
      this._applyZoomTransform(this.pan.x, this.pan.y, this.currZoomLevel)
      if (this === this.lightbox.currSlide) {
        this.lightbox.dispatch('zoomPanUpdate', { slide: this })
      }
    },

    zoomAndPanToInitial() {
      this.currZoomLevel = this.zoomLevels.initial
      this.bounds.update(this.currZoomLevel)
      equalizePoints(this.pan, this.bounds.center)
      this.lightbox.dispatch('initialZoomPan', { slide: this })
    },

    _applyZoomTransform(x: number, y: number, zoom: number) {
      zoom /= this.currentResolution || this.zoomLevels.initial
      setTransform(this.container, x, y, zoom)
    },

    calculateSize() {
      equalizePoints(
        this.panAreaSize,
        getPanAreaSize(this.lightbox.options, this.lightbox.viewportSize, this.data, this.index),
      )
      this.zoomLevels.update(this.width, this.height, this.panAreaSize)
      this.lightbox.dispatch('calcSlideSize', { slide: this })
    },

    getCurrentTransform(): string {
      const scale = this.currZoomLevel / (this.currentResolution || this.zoomLevels.initial)
      return toTransformString(this.pan.x, this.pan.y, scale)
    },

    _setResolution(newResolution: number) {
      if (newResolution === this.currentResolution) return
      this.currentResolution = newResolution
      this.updateContentSize()
      this.lightbox.dispatch('resolutionChanged')
    },
  }

  slide.content = lightbox.contentLoader.getContentBySlide(slide)
  slide.width = slide.content.width
  slide.height = slide.content.height
  slide.bounds = createPanBounds(slide)

  lightbox.dispatch('slideInit', { slide })

  return slide
}
