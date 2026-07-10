import {
  PhotoAlbum,
  PhotoCarousel,
  useLightboxProvider,
  type PhotoItem,
} from '../../src/index'

const readonlyPhotos = [
  { id: 'one', src: '/one.jpg', width: 1200, height: 800 },
] as const satisfies readonly PhotoItem[]

const controller = useLightboxProvider(readonlyPhotos)
void controller.openById('one')

// @ts-expect-error Controller read models are readonly.
controller.activeIndex.value = 1
// @ts-expect-error Object-identity opening was removed from the public API.
controller.openPhoto(readonlyPhotos[0])

// @ts-expect-error Numeric IDs must be normalized at the application boundary.
const numericId: PhotoItem = { id: 1, src: '/one.jpg', width: 1, height: 1 }
void numericId

type AlbumProps = InstanceType<typeof PhotoAlbum>['$props']
const albumProps: AlbumProps = {
  photos: readonlyPhotos,
  layout: { type: 'rows', targetRowHeight: 280 },
}
void albumProps

const removedAlbumProp: AlbumProps = {
  photos: readonlyPhotos,
  // @ts-expect-error Layout values live only in the object-form layout prop.
  columns: 3,
}
void removedAlbumProp

type CarouselProps = InstanceType<typeof PhotoCarousel>['$props']
const carouselProps: CarouselProps = {
  photos: readonlyPhotos,
  options: { loop: true, slidesToScroll: 2 },
  autoplay: { delayMs: 4000, stopOnMouseEnter: true },
}
void carouselProps

const removedCarouselProp: CarouselProps = {
  photos: readonlyPhotos,
  // @ts-expect-error Vendor plugins are not part of the public component API.
  plugins: [],
}
void removedCarouselProp
