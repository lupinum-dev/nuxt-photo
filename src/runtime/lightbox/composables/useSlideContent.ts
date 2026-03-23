import {
  LOAD_STATE,
  createElement,
  isSafari,
  setWidthHeight,
  toTransformString,
} from '../utils/dom'
import { decodeImage } from '../utils/decode'
import { debugWarn } from '../utils/debug'
import type {
  ContentInstance,
  LoadState,
  LightboxImageItem,
  LightboxInstance,
  LightboxItem,
  PlaceholderInstance,
  SlideInstance,
} from '../types'

export function createPlaceholder(imageSrc: string | false, container: HTMLElement): PlaceholderInstance {
  const element = createElement(
    'photo-lightbox__img photo-lightbox__img--placeholder',
    imageSrc ? 'img' : 'div',
    container,
  ) as HTMLImageElement | HTMLDivElement

  if (imageSrc) {
    const imageElement = element as HTMLImageElement
    imageElement.decoding = 'async'
    imageElement.alt = ''
    imageElement.src = imageSrc
    imageElement.setAttribute('role', 'presentation')
  }

  element.setAttribute('aria-hidden', 'true')

  return {
    element,
    setDisplayedSize(width: number, height: number) {
      if (!this.element) return
      if (this.element.tagName === 'IMG') {
        setWidthHeight(this.element, 250, 'auto')
        this.element.style.transformOrigin = '0 0'
        this.element.style.transform = toTransformString(0, 0, width / 250)
      }
      else {
        setWidthHeight(this.element, width, height)
      }
    },
    destroy() {
      if (this.element?.parentNode) {
        this.element.remove()
      }
      this.element = null as unknown as HTMLDivElement
    },
  }
}

export function useContent(
  itemData: LightboxItem,
  instance: LightboxInstance,
  index: number,
): ContentInstance {
  const contentFadeDuration = 180

  const content: ContentInstance = {
    instance,
    data: itemData,
    index,
    element: undefined,
    placeholder: undefined,
    slide: undefined,
    displayedImageWidth: 0,
    displayedImageHeight: 0,
    width: Number(itemData.width) || 0,
    height: Number(itemData.height) || 0,
    isAttached: false,
    hasSlide: false,
    isDecoding: false,
    state: LOAD_STATE.IDLE as LoadState,
    type: itemData.type || ('src' in itemData ? 'image' : 'custom'),

    removePlaceholder() {
      if (this.placeholder && !this.keepPlaceholder()) {
        const animationDuration = this.instance?.options?.showAnimationDuration || 0
        const safeDelay = (typeof animationDuration === 'number' ? animationDuration : 0) + 500
        setTimeout(() => {
          if (this.placeholder) {
            const placeholderElement = this.placeholder.element
            if (placeholderElement) {
              placeholderElement.classList.add('photo-lightbox__img--fading-out')
            }
            setTimeout(() => {
              if (this.placeholder) {
                this.placeholder.destroy()
                this.placeholder = undefined
              }
            }, contentFadeDuration)
          }
        }, safeDelay)
      }
    },

    load(isLazy: boolean, reload?: boolean) {
      if (this.slide && this.usePlaceholder()) {
        if (!this.placeholder) {
          const placeholderSrc = this.instance.applyFilters(
            'placeholderSrc',
            this.data.msrc && this.slide.isFirstSlide ? this.data.msrc : false,
            this,
          ) as string | false
          this.placeholder = createPlaceholder(placeholderSrc, this.slide.container)
        }
        else {
          const placeholderElement = this.placeholder.element
          if (placeholderElement && !placeholderElement.parentElement) {
            this.slide.container.prepend(placeholderElement)
          }
        }
      }

      if (this.element && !reload) return

      if (this.instance.dispatch('contentLoad', { content: this, isLazy }).defaultPrevented) return

      if (this.isImageContent()) {
        this.element = createElement('photo-lightbox__img', 'img')
        this.element.classList.add('photo-lightbox__img--full')
        if (this.displayedImageWidth) {
          this.loadImage(isLazy)
        }
      }
      else {
        this.element = createElement('photo-lightbox__content', 'div')
      }

      if (reload && this.slide) {
        this.slide.updateContentSize(true)
      }
    },

    loadImage(isLazy: boolean) {
      if (
        !this.isImageContent()
        || !this.element
        || this.instance.dispatch('contentLoadImage', { content: this, isLazy }).defaultPrevented
      ) return

      const imageElement = this.element as HTMLImageElement
      const imageData = this.data as LightboxImageItem
      this.updateSrcsetSizes()

      if (imageData.srcset) {
        imageElement.srcset = imageData.srcset
      }

      imageElement.src = imageData.src
      imageElement.alt = imageData.alt ?? ''
      this.state = LOAD_STATE.LOADING

      if (imageElement.complete) {
        this.onLoaded()
      }
      else {
        imageElement.onload = () => this.onLoaded()
        imageElement.onerror = () => this.onError()
      }
    },

    setSlide(slide: SlideInstance) {
      this.slide = slide
      this.hasSlide = true
      this.instance = slide.lightbox
    },

    onLoaded() {
      this.state = LOAD_STATE.LOADED
      if (this.isImageContent() && this.element instanceof HTMLImageElement) {
        const declaredWidth = Number(this.data.width ?? 0)
        const declaredHeight = Number(this.data.height ?? 0)
        const naturalWidth = this.element.naturalWidth
        const naturalHeight = this.element.naturalHeight

        if (declaredWidth && declaredHeight && naturalWidth && naturalHeight) {
          const declaredRatio = declaredWidth / declaredHeight
          const naturalRatio = naturalWidth / naturalHeight
          const ratioDelta = Math.abs(declaredRatio - naturalRatio) / naturalRatio

          if (ratioDelta >= 0.1) {
            debugWarn(this.instance.options, 'content.onLoaded:dimension-mismatch', {
              index: this.index,
              src: this.data.src,
              declared: {
                width: declaredWidth,
                height: declaredHeight,
                ratio: declaredRatio,
              },
              natural: {
                width: naturalWidth,
                height: naturalHeight,
                ratio: naturalRatio,
              },
            })
          }
        }
      }

      if (this.slide && this.element) {
        this.instance.dispatch('loadComplete', { slide: this.slide, content: this })
        if (this.slide.isActive && this.slide.heavyAppended && !this.element.parentNode) {
          this.append()
          this.slide.updateContentSize(true)
        }
        if (this.element.parentNode) {
          this.appendImage()
        }
        if (this.state === LOAD_STATE.LOADED || this.state === LOAD_STATE.ERROR) {
          this.removePlaceholder()
        }
      }
    },

    onError() {
      this.state = LOAD_STATE.ERROR
      if (this.slide) {
        this.displayError()
        this.instance.dispatch('loadComplete', { slide: this.slide, isError: true, content: this })
        this.instance.dispatch('loadError', { slide: this.slide, content: this })
      }
    },

    isLoading() {
      return this.instance.applyFilters('isContentLoading', this.state === LOAD_STATE.LOADING, this) as boolean
    },

    isError() {
      return this.state === LOAD_STATE.ERROR
    },

    isImageContent() {
      return this.type === 'image'
    },

    setDisplayedSize(width: number, height: number) {
      if (!this.element) return
      if (this.placeholder) {
        this.placeholder.setDisplayedSize(width, height)
      }
      if (this.instance.dispatch('contentResize', { content: this, width, height }).defaultPrevented) return

      setWidthHeight(this.element, width, height)

      if (this.isImageContent() && !this.isError()) {
        const isInitialSizeUpdate = !this.displayedImageWidth && width
        this.displayedImageWidth = width
        this.displayedImageHeight = height

        if (isInitialSizeUpdate) {
          this.loadImage(false)
        }
        else {
          this.updateSrcsetSizes()
        }

        if (this.slide) {
          this.instance.dispatch('imageSizeChange', {
            slide: this.slide, width, height, content: this,
          })
        }
      }
    },

    isZoomable() {
      return this.instance.applyFilters(
        'isContentZoomable',
        this.isImageContent() && this.state !== LOAD_STATE.ERROR,
        this,
      ) as boolean
    },

    updateSrcsetSizes() {
      if (!this.isImageContent() || !this.element || !this.data.srcset) return
      const imageElement = this.element as HTMLImageElement
      const sizesWidth = this.instance.applyFilters('srcsetSizesWidth', this.displayedImageWidth, this) as number
      if (!imageElement.dataset.largestUsedSize || sizesWidth > Number.parseInt(imageElement.dataset.largestUsedSize, 10)) {
        imageElement.sizes = sizesWidth + 'px'
        imageElement.dataset.largestUsedSize = String(sizesWidth)
      }
    },

    usePlaceholder() {
      return this.instance.applyFilters('useContentPlaceholder', this.isImageContent(), this) as boolean
    },

    lazyLoad() {
      if (this.instance.dispatch('contentLazyLoad', { content: this }).defaultPrevented) return
      this.load(true)
    },

    keepPlaceholder() {
      return this.instance.applyFilters('isKeepingPlaceholder', this.isLoading(), this) as boolean
    },

    destroy() {
      this.hasSlide = false
      this.slide = undefined
      if (this.instance.dispatch('contentDestroy', { content: this }).defaultPrevented) return
      this.remove()
      if (this.placeholder) {
        this.placeholder.destroy()
        this.placeholder = undefined
      }
      if (this.isImageContent() && this.element) {
        (this.element as HTMLImageElement).onload = null
        ;(this.element as HTMLImageElement).onerror = null
        this.element = undefined
      }
    },

    displayError() {
      if (this.slide) {
        let errorMessageElement = createElement('photo-lightbox__error-msg', 'div')
        errorMessageElement.textContent = this.instance.options?.errorMsg ?? ''
        errorMessageElement = this.instance.applyFilters('contentErrorElement', errorMessageElement, this) as HTMLDivElement
        this.element = createElement('photo-lightbox__content photo-lightbox__error-msg-container', 'div')
        this.element.appendChild(errorMessageElement)
        this.slide.container.textContent = ''
        this.slide.container.appendChild(this.element)
        this.slide.updateContentSize(true)
        this.removePlaceholder()
      }
    },

    append() {
      if (this.isAttached || !this.element) return
      this.isAttached = true

      if (this.state === LOAD_STATE.ERROR) {
        this.displayError()
        return
      }

      if (this.instance.dispatch('contentAppend', { content: this }).defaultPrevented) return

      const supportsDecode = 'decode' in this.element

      if (this.isImageContent()) {
        if (supportsDecode && this.slide && (!this.slide.isActive || isSafari())) {
          this.isDecoding = true
          decodeImage(this.element as HTMLImageElement).finally(() => {
            this.isDecoding = false
            this.appendImage()
          })
        }
        else {
          this.appendImage()
        }
      }
      else if (this.slide && !this.element.parentNode) {
        this.slide.container.appendChild(this.element)
      }
    },

    activate() {
      if (this.instance.dispatch('contentActivate', { content: this }).defaultPrevented || !this.slide) return

      if (this.isImageContent() && this.isDecoding && !isSafari()) {
        this.appendImage()
      }
      else if (this.isError()) {
        this.load(false, true)
      }

      if (this.slide.holderElement) {
        this.slide.holderElement.setAttribute('aria-hidden', 'false')
      }
    },

    deactivate() {
      this.instance.dispatch('contentDeactivate', { content: this })
      if (this.slide?.holderElement) {
        this.slide.holderElement.setAttribute('aria-hidden', 'true')
      }
    },

    remove() {
      this.isAttached = false
      if (this.instance.dispatch('contentRemove', { content: this }).defaultPrevented) return
      if (this.element?.parentNode) this.element.remove()
      if (this.placeholder?.element) this.placeholder.element.remove()
    },

    appendImage() {
      if (!this.isAttached) return
      if (this.instance.dispatch('contentAppendImage', { content: this }).defaultPrevented) return
      if (this.slide && this.element && !this.element.parentNode) {
        this.slide.container.appendChild(this.element)
      }
      if (
        this.element instanceof HTMLImageElement
        && (!this.placeholder?.element || this.state === LOAD_STATE.LOADED || this.state === LOAD_STATE.ERROR)
      ) {
        const reveal = () => {
          this.element?.classList.add('photo-lightbox__img--visible')
        }

        if (this.placeholder?.element) {
          requestAnimationFrame(() => reveal())
        }
        else {
          reveal()
        }
      }
      if (this.state === LOAD_STATE.LOADED || this.state === LOAD_STATE.ERROR) {
        this.removePlaceholder()
      }
    },
  }

  content.instance.dispatch('contentInit', { content })

  return content
}
