import { createElement, setTransform } from '../utils/dom'
import type {
  AnimationsInstance,
  ItemHolder,
  MainScrollInstance,
  LightboxDOMBinding,
  LightboxEvent,
  Point,
  PreparedLightboxOptions,
  SlideInstance,
} from '../types'

const MAIN_SCROLL_END_FRICTION = 0.35

interface MainScrollDeps {
  options: PreparedLightboxOptions
  viewportSize: Point
  domBinding?: LightboxDOMBinding
  animations: Pick<AnimationsInstance, 'stopMainScroll' | 'startSpring' | 'stopAllPan'>
  getContainer(): HTMLDivElement | undefined
  getNumItems(): number
  canLoop(): boolean
  getLoopedIndex(index: number): number
  getCurrIndex(): number
  setCurrIndex(index: number): void
  getPotentialIndex(): number
  setPotentialIndex(index: number): void
  getCurrSlide(): SlideInstance | undefined
  setCurrSlide(slide: SlideInstance | undefined): void
  setContent(holder: ItemHolder, index: number): void
  updateLazy(diff?: number): void
  appendHeavy(): void
  dispatch<T extends string>(name: T, details?: Record<string, unknown>): LightboxEvent<T>
}

export function createMainScroll(deps: MainScrollDeps): MainScrollInstance {
  let currPositionIndex = 0
  let prevPositionIndex = 0
  let containerShiftIndex = -1

  const scroll: MainScrollInstance = {
    x: 0,
    slideWidth: 0,
    itemHolders: [],

    resize(resizeSlides?: boolean) {
      const newSlideWidth = Math.round(
        deps.viewportSize.x + deps.viewportSize.x * deps.options.spacing,
      )
      const slideWidthChanged = newSlideWidth !== scroll.slideWidth

      if (slideWidthChanged) {
        scroll.slideWidth = newSlideWidth
        scroll.moveTo(scroll.getCurrSlideX())
      }

      scroll.itemHolders.forEach((itemHolder, index) => {
        if (slideWidthChanged) {
          setTransform(itemHolder.el, (index + containerShiftIndex) * scroll.slideWidth)
        }
        if (resizeSlides && itemHolder.slide) {
          itemHolder.slide.resize()
        }
      })
    },

    resetPosition() {
      currPositionIndex = 0
      prevPositionIndex = 0
      scroll.slideWidth = 0
      containerShiftIndex = -1
    },

    appendHolders() {
      scroll.itemHolders = []
      const holderElements = deps.domBinding?.itemHolders || []
      const container = deps.getContainer()

      for (let i = 0; i < 3; i++) {
        const el = holderElements[i] || createElement('photo-lightbox__item', 'div', container)
        el.replaceChildren()
        el.setAttribute('role', 'group')
        el.setAttribute('aria-roledescription', 'slide')
        el.setAttribute('aria-hidden', i === 1 ? 'false' : 'true')
        el.style.display = i === 1 ? 'block' : 'none'
        scroll.itemHolders.push({ el })
      }
    },

    canBeSwiped(): boolean {
      return deps.getNumItems() > 1
    },

    moveIndexBy(diff: number, animate?: boolean, velocityX?: number): boolean {
      let newIndex = deps.getPotentialIndex() + diff
      const numSlides = deps.getNumItems()

      if (deps.canLoop()) {
        newIndex = deps.getLoopedIndex(newIndex)
        const distance = (diff + numSlides) % numSlides
        if (distance <= numSlides / 2) {
          diff = distance
        }
        else {
          diff = distance - numSlides
        }
      }
      else {
        if (newIndex < 0) {
          newIndex = 0
        }
        else if (newIndex >= numSlides) {
          newIndex = numSlides - 1
        }
        diff = newIndex - deps.getPotentialIndex()
      }

      deps.setPotentialIndex(newIndex)
      currPositionIndex -= diff

      deps.animations.stopMainScroll()

      const destinationX = scroll.getCurrSlideX()
      if (!animate) {
        scroll.moveTo(destinationX)
        scroll.updateCurrItem()
      }
      else {
        deps.animations.startSpring({
          isMainScroll: true,
          start: scroll.x,
          end: destinationX,
          velocity: velocityX || 0,
          naturalFrequency: 30,
          dampingRatio: 1,
          onUpdate: (x) => {
            scroll.moveTo(x)
          },
          onComplete: () => {
            scroll.updateCurrItem()
            deps.appendHeavy()
          },
        })

        let currDiff = deps.getPotentialIndex() - deps.getCurrIndex()
        if (deps.canLoop()) {
          const currDistance = (currDiff + numSlides) % numSlides
          if (currDistance <= numSlides / 2) {
            currDiff = currDistance
          }
          else {
            currDiff = currDistance - numSlides
          }
        }

        if (Math.abs(currDiff) > 1) {
          scroll.updateCurrItem()
        }
      }

      return Boolean(diff)
    },

    getCurrSlideX(): number {
      return scroll.slideWidth * currPositionIndex
    },

    isShifted(): boolean {
      return scroll.x !== scroll.getCurrSlideX()
    },

    updateCurrItem() {
      const positionDifference = prevPositionIndex - currPositionIndex
      if (!positionDifference) return

      prevPositionIndex = currPositionIndex
      deps.setCurrIndex(deps.getPotentialIndex())

      let diffAbs = Math.abs(positionDifference)
      let tempHolder: ItemHolder | undefined

      if (diffAbs >= 3) {
        containerShiftIndex += positionDifference + (positionDifference > 0 ? -3 : 3)
        diffAbs = 3
        scroll.itemHolders.forEach((itemHolder) => {
          itemHolder.slide?.destroy()
          itemHolder.slide = undefined
        })
      }

      for (let i = 0; i < diffAbs; i++) {
        if (positionDifference > 0) {
          tempHolder = scroll.itemHolders.shift()
          if (tempHolder) {
            scroll.itemHolders[2] = tempHolder
            containerShiftIndex++
            setTransform(tempHolder.el, (containerShiftIndex + 2) * scroll.slideWidth)
            deps.setContent(tempHolder, deps.getCurrIndex() - diffAbs + i + 2)
          }
        }
        else {
          tempHolder = scroll.itemHolders.pop()
          if (tempHolder) {
            scroll.itemHolders.unshift(tempHolder)
            containerShiftIndex--
            setTransform(tempHolder.el, containerShiftIndex * scroll.slideWidth)
            deps.setContent(tempHolder, deps.getCurrIndex() + diffAbs - i - 2)
          }
        }
      }

      if (Math.abs(containerShiftIndex) > 50 && !scroll.isShifted()) {
        scroll.resetPosition()
        scroll.resize()
      }

      deps.animations.stopAllPan()

      scroll.itemHolders.forEach((itemHolder, i) => {
        if (itemHolder.slide) {
          itemHolder.slide.setIsActive(i === 1)
        }
      })

      deps.setCurrSlide(scroll.itemHolders[1]?.slide)
      deps.updateLazy(positionDifference)

      deps.getCurrSlide()?.applyCurrentZoomPan()
      deps.dispatch('change')
    },

    moveTo(x: number, dragging?: boolean) {
      if (!deps.canLoop() && dragging) {
        let newSlideIndexOffset
          = (scroll.slideWidth * currPositionIndex - x) / scroll.slideWidth
        newSlideIndexOffset += deps.getCurrIndex()
        const delta = Math.round(x - scroll.x)

        if (
          (newSlideIndexOffset < 0 && delta > 0)
          || (newSlideIndexOffset >= deps.getNumItems() - 1 && delta < 0)
        ) {
          x = scroll.x + delta * MAIN_SCROLL_END_FRICTION
        }
      }

      scroll.x = x

      const container = deps.getContainer()
      if (container) {
        setTransform(container, x)
      }

      deps.dispatch('moveMainScroll', { x, dragging: dragging ?? false })
    },
  }

  return scroll
}
