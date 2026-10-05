import {
  Photo,
  PhotoAlbum,
  PhotoCarousel,
  PhotoGroup,
  useLightbox,
  type CarouselSlideSlotProps,
  definePhotoProvider,
  type PhotoItem,
  type AlbumLayout,
  type BentoAlbumLayout,
} from '../../src/index'

type GenericComponentProps<T> = T extends (...args: infer Args) => unknown ? Args[0] : never
type GenericComponentExposed<T> = T extends (
  props: never,
  context: never,
  expose?: infer Expose,
  ...args: never[]
) => unknown
  ? NonNullable<Expose> extends (exposed: infer Exposed) => void
    ? Exposed
    : never
  : never
type GenericComponentSlots<T> = T extends (
  props: never,
  context?: infer Context,
  ...args: never[]
) => unknown
  ? NonNullable<Context> extends { slots: infer Slots }
    ? Slots
    : never
  : never

const readonlyPhotos = [
  { id: 'one', src: '/one.jpg', width: 1200, height: 800 },
] as const satisfies readonly PhotoItem[]

const controller = useLightbox()
void controller.openById('one')

// @ts-expect-error Controller read models are readonly.
controller.activeIndex.value = 1
// @ts-expect-error Object-identity opening was removed from the public API.
controller.openPhoto(readonlyPhotos[0])

// @ts-expect-error Numeric IDs must be normalized at the application boundary.
const numericId: PhotoItem = { id: 1, src: '/one.jpg', width: 1, height: 1 }
void numericId

interface ConsumerMeta {
  photographer: string
}
const photoWithInterfaceMeta: PhotoItem<ConsumerMeta> = {
  ...readonlyPhotos[0],
  meta: { photographer: 'Ada' },
}
void photoWithInterfaceMeta

const provider = definePhotoProvider({
  url: (src: string, options: { width: number }) => `${src}?w=${options.width}`,
})
void provider.url('/one.jpg', { width: 640 })

const metadataController = useLightbox<ConsumerMeta>()
const activePhotographer: string | undefined =
  metadataController.activePhoto.value?.meta?.photographer
void activePhotographer

declare const carouselSlide: CarouselSlideSlotProps<ConsumerMeta>
const slidePhotographer: string | undefined = carouselSlide.photo.meta?.photographer
void slidePhotographer

const photoWithDateMeta: PhotoItem<Date> = {
  ...readonlyPhotos[0],
  meta: new Date(0),
}
void photoWithDateMeta

type AlbumProps = GenericComponentProps<typeof PhotoAlbum>
const albumProps: AlbumProps = {
  photos: readonlyPhotos,
  layout: { type: 'rows', targetRowHeight: 280 },
}
void albumProps

type CarouselProps = GenericComponentProps<typeof PhotoCarousel>
const carouselProps: CarouselProps = {
  photos: readonlyPhotos,
  loop: true,
  dragFree: true,
  autoplay: { delayMs: 4000, stopOnMouseEnter: true },
}
void carouselProps

type GroupProps = GenericComponentProps<typeof PhotoGroup>
const groupProps: GroupProps = { photos: readonlyPhotos }
void groupProps

declare const groupInstance: GenericComponentExposed<typeof PhotoGroup>
void groupInstance.openById('one')
// @ts-expect-error Thumbnail-source plumbing is internal to grouped recipes.
void groupInstance.openById('one', document.body)

declare const photoInstance: GenericComponentExposed<typeof Photo>
void photoInstance.open(0)

declare const carouselInstance: GenericComponentExposed<typeof PhotoCarousel>
void carouselInstance.open(0)

type GroupDefaultSlot = NonNullable<GenericComponentSlots<typeof PhotoGroup>['default']>
declare const groupSlot: Parameters<GroupDefaultSlot>[0]
// @ts-expect-error Group slot collections are readonly.
groupSlot.photos.push(readonlyPhotos[0])

const albumActive: AlbumProps['active'] = 'one'
const photoActive: GenericComponentProps<typeof Photo>['active'] = null
void albumActive
void photoActive
void carouselInstance.scrollTo(1)
void carouselInstance.next()
void carouselInstance.prev()

const unresolvedPhoto: PhotoItem = { id: 'local', src: '/local.jpg' }
void unresolvedPhoto
const nestedAlbumOptions: AlbumProps = {
  photos: readonlyPhotos,
  lightbox: { transition: 'none', navigation: 'fade' },
  ui: { root: 'root', item: 'item', img: 'image' },
}
void nestedAlbumOptions
// @ts-expect-error Components belong under lightbox.component.
const bareComponent: AlbumProps['lightbox'] = Photo
void bareComponent
// @ts-expect-error Album ui only accepts root, item and img.
const wrongUi: AlbumProps['ui'] = { caption: 'caption' }
void wrongUi
// @ts-expect-error Carousel control names are a closed set.
const wrongControl: CarouselProps['controls'] = ['pause']
void wrongControl

// @ts-expect-error Internal controller types are not root exports.
import type { LightboxProviderController } from '../../src'
// @ts-expect-error Internal renderer types are not root exports.
import type { LightboxSlideRenderer } from '../../src'
// @ts-expect-error TransitionMode is internal; consumers use LightboxTransitionOption.
import type { TransitionMode } from '../../src'
// @ts-expect-error ResponsiveResolver is internal; consumers use ResponsiveParameter.
import type { ResponsiveResolver } from '../../src'

declare const removedTypes: [
  LightboxProviderController,
  LightboxSlideRenderer,
  TransitionMode,
  ResponsiveResolver,
]
void removedTypes

const bentoLayout: BentoAlbumLayout<{ cover?: boolean }> = {
  type: 'bento',
  featured: (photo, index) => {
    const cover: boolean | undefined = photo.meta?.cover
    return cover === true && index >= 0
  },
}
const genericLayout: AlbumLayout<{ cover?: boolean }> = bentoLayout
void genericLayout
const invalidBentoLayout: BentoAlbumLayout = {
  type: 'bento',
  // @ts-expect-error Bento rejects unknown layout options.
  unknownOption: true,
}
void invalidBentoLayout
