import {
  PhotoAlbum,
  PhotoCarousel,
  PhotoGroup,
  useLightboxProvider,
  type CarouselSlideSlotProps,
  type ImageAdapter,
  type PhotoItem,
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

const controller = useLightboxProvider(readonlyPhotos)
void controller.openById('one')
const getterController = useLightboxProvider(() => readonlyPhotos)
void getterController.openById('one')

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

const metadataAdapter: ImageAdapter<ConsumerMeta> = (photo) => ({
  src: `/photographers/${photo.meta?.photographer ?? 'unknown'}/${photo.src}`,
})
void metadataAdapter

const metadataController = useLightboxProvider([photoWithInterfaceMeta])
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
  options: { loop: true, slidesToScroll: 2 },
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

type GroupDefaultSlot = NonNullable<GenericComponentSlots<typeof PhotoGroup>['default']>
declare const groupSlot: Parameters<GroupDefaultSlot>[0]
// @ts-expect-error Group slot collections are readonly.
groupSlot.photos.push(readonlyPhotos[0])
