import {
  computed,
  defineAsyncComponent,
  defineComponent,
  h,
  inject,
  provide,
  ref,
  shallowRef,
  type ComputedRef,
} from 'vue'
import { useGalleryRuntime } from '../../gallery/runtime'
import { initialPhotoId } from '../../gallery/deepLink'
import { useViewerIntent, type ViewerBridge } from '../../gallery/viewer'
import type { ProvidedLightbox } from '../../composables/provideLightbox'
import type { ResolvedPhotoItem as PhotoItem } from '../../core/index'
import { photoAt, photoIndexOf } from '../../core/photo/lookup'
import { usePhotoConfig, type LightboxOptions } from '../../config'
import { LightboxControllerKey, type LightboxProviderController } from '../../provide/keys'
import { warnOnSetupOptionChanges } from '../../internal/staticOptionWarnings'
import { resolveLightboxComponent } from '../shared/resolveLightboxComponent'
import { findPhotoTrigger } from '../shared/photoTriggerBindings'
import { buildPhotoGroupCapabilityIndex } from './capabilities'
import { PhotoGroupContextKey, type PhotoGroupCapability, type PhotoGroupContext } from './context'

// The viewer (engine and lightbox) is the only lazy part of a group: one chunk, loaded on intent.
// `@lupinum/vue-photo/viewer` is a named seam of the exports map: the Nuxt module points it
// at a host that also brings the lightbox CSS.
// Every caller shares the first load: Vite's preload helper waits for that CSS only in the
// first call of an import(), so a later call could mount the viewer before its styles apply.
let viewerLoad: ReturnType<typeof importViewer> | undefined
const importViewer = () => import('@lupinum/vue-photo/viewer')
const loadViewer = () =>
  (viewerLoad ??= importViewer().catch((error: unknown) => {
    viewerLoad = undefined
    throw error
  }))
const ViewerHost = defineAsyncComponent(loadViewer)

type PhotoGroupOptions<TMeta extends object> = {
  /** Component name for warnings. */
  owner: string
  /** The collection in navigation order. */
  photos: ComputedRef<readonly PhotoItem<TMeta>[]>
  /** Where to look for thumbnails and read the text direction. */
  root: () => HTMLElement | null
  /** The `lightbox` prop; read once at setup. */
  lightbox: () => boolean | LightboxOptions | undefined
  /** Whether the lightbox is on when the prop is not set. */
  defaultEnabled: boolean
}

/**
 * The group logic shared by `PhotoGroup` and every recipe that stands alone. It owns the
 * photo identity and the public controller, and provides the controller to descendants but
 * not `PhotoGroupContextKey`; `PhotoGroup` does that. The viewer loads on intent and mounts
 * when a photo opens; until then the controller answers from the identity store.
 */
export function usePhotoGroup<TMeta extends object>(options: PhotoGroupOptions<TMeta>) {
  const { photos } = options
  const gallery = useGalleryRuntime(photos, options.root)
  const config = usePhotoConfig()

  const resolved = resolveLightboxComponent(
    options.lightbox(),
    config.value.lightbox.component ?? null,
    options.defaultEnabled,
  )
  warnOnSetupOptionChanges(options.owner, {
    lightbox: () => {
      const value = options.lightbox()
      return typeof value === 'object' ? (value.component ?? true) : value
    },
  })
  const enabled = resolved !== null

  const ids = computed(() => new Set(photos.value.map((photo) => photo.id)))
  const capabilityBatches = shallowRef(new Map<symbol, readonly PhotoGroupCapability[]>())
  const capabilitiesById = computed(() =>
    buildPhotoGroupCapabilityIndex(ids.value, capabilityBatches.value),
  )

  // A page that opens with one of this group's photos renders the viewer on the server, so
  // the open lightbox is in the HTML; the identity store selects the photo before render.
  const linkedIndex = enabled
    ? photos.value.findIndex(
        (photo) =>
          photo.id ===
          initialPhotoId(
            typeof window === 'undefined' ? config.value.initialUrl : window.location.href,
            config.value.lightbox.deepLink,
          ),
      )
    : -1
  if (linkedIndex >= 0) gallery.requestIndex(linkedIndex)

  const viewerMounted = ref(linkedIndex >= 0)
  const viewer = shallowRef<ProvidedLightbox<object> | null>(null)
  let ready: Promise<ProvidedLightbox<object>> | null = null
  let settle: { resolve(v: ProvidedLightbox<object>): void; reject(e: unknown): void } | null = null
  const bridge: ViewerBridge = {
    photos,
    gallery,
    component: resolved === true ? null : resolved,
    resolveSlide: (photo) => capabilitiesById.value.get(photo.id)?.renderSlide ?? null,
    thumbnailFor: (id) => findPhotoTrigger(options.root(), id),
    attach(next) {
      viewer.value = next
      if (next) settle?.resolve(next)
      else ready = null
    },
  }

  /** Mount the viewer and wait until it can open photos. */
  function mountViewer() {
    if (viewer.value) return Promise.resolve(viewer.value)
    ready ??= new Promise((resolve, reject) => {
      settle = { resolve, reject }
      loadViewer().catch(reject)
    })
    viewerMounted.value = true
    return ready
  }
  if (enabled) useViewerIntent(options.root, () => void loadViewer())

  const Viewer = defineComponent({
    name: 'PhotoGroupViewer',
    setup: () => () => (viewerMounted.value ? h(ViewerHost, { bridge }) : null),
  })

  function hasPhoto(id: string) {
    return ids.value.has(id)
  }

  // A group without a lightbox has nothing to render, so it accepts no registrations.
  function replaceCapabilities(owner: symbol, entries: readonly PhotoGroupCapability[]) {
    if (!enabled) return
    for (const entry of entries) {
      if (!hasPhoto(entry.id)) {
        throw new Error(
          `[nuxt-photo] PhotoGroup descendant photo "${entry.id}" is missing from the canonical photos collection. ` +
            'Add it to the photos of the surrounding <PhotoGroup>, or render it outside the group. ' +
            'See https://nuxt-photo.lupinum.com/docs/reference/photo-group',
        )
      }
    }
    const next = new Map(capabilityBatches.value)
    if (entries.length === 0) next.delete(owner)
    else next.set(owner, [...entries])
    buildPhotoGroupCapabilityIndex(ids.value, next)
    capabilityBatches.value = next
  }

  function removeCapabilities(owner: symbol) {
    if (!capabilityBatches.value.has(owner)) return
    const next = new Map(capabilityBatches.value)
    next.delete(owner)
    capabilityBatches.value = next
  }

  // Each open or close is a new request; an open that waited for the viewer gives way to a
  // later one, so a close during loading wins.
  let request = 0
  async function activate(id: string, source: HTMLElement | null = null) {
    photoIndexOf(photos.value, id)
    if (!enabled) return
    const own = ++request
    const lightbox = await mountViewer()
    if (own === request) await lightbox.activate(id, source)
  }

  async function close() {
    request++
    await viewer.value?.close()
  }

  const isOpen = computed(() => enabled && gallery.isOpen.value)
  const hiddenId = computed(() => viewer.value?.hiddenThumbnailId.value ?? null)
  const context: PhotoGroupContext = {
    enabled,
    hasPhoto,
    activate,
    openById: (id) => activate(id),
    close,
    isOpen,
    activeId: computed(() => (isOpen.value ? gallery.activeId.value : null)),
    activePhoto: computed(() => (isOpen.value ? gallery.activePhoto.value : null)),
    hiddenId,
    replaceCapabilities,
    removeCapabilities,
  }

  /** Opens `photos[index]` of this group's own collection. */
  async function open(index = 0) {
    await context.openById(photoAt(photos.value, index).id)
  }

  // The public controller, the same before and after the viewer loads. With the lightbox off,
  // it reports nothing open and its methods do nothing.
  const read = <T>(value: () => T) => computed(() => (enabled ? value() : null))
  const controller: LightboxProviderController<TMeta> = {
    photos: computed(() => photos.value),
    count: computed(() => photos.value.length),
    activeId: read(() => gallery.activeId.value),
    activeIndex: computed(() => (enabled ? gallery.activeIndex.value : 0)),
    activePhoto: read(
      () => photos.value.find((photo) => photo.id === gallery.activeId.value) ?? null,
    ),
    isOpen,
    hiddenThumbnailId: hiddenId,
    open,
    openById: context.openById,
    close,
    next: () => viewer.value?.next(),
    prev: () => viewer.value?.prev(),
    toggleZoom: () => viewer.value?.toggleZoom(),
  }
  if (enabled) provide(LightboxControllerKey, controller)

  return { context, lightboxComponent: enabled ? Viewer : null, open, controller }
}

/**
 * The group a recipe talks to: the surrounding `PhotoGroup`, or one it creates for itself.
 * `lightboxComponent` is set only for a group the recipe created, because its creator renders it.
 */
export function useRecipeGroup<TMeta extends object>(options: PhotoGroupOptions<TMeta>) {
  const parent = inject(PhotoGroupContextKey, null)
  if (parent) return { group: parent, lightboxComponent: null }
  const own = usePhotoGroup(options)
  return { group: own.context, lightboxComponent: own.lightboxComponent }
}
