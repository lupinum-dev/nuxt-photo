/** Classes merged with each recipe's built-in np-* classes. */
export type PhotoUi<T extends keyof PhotoUiKeys = keyof PhotoUiKeys> = Partial<
  Record<PhotoUiKeys[T], string>
>

type PhotoUiKeys = {
  Photo: 'root' | 'img' | 'caption'
  PhotoAlbum: 'root' | 'item' | 'img'
  PhotoCarousel: 'root' | 'slide' | 'img' | 'thumb' | 'caption' | 'controls'
  PhotoGroup: 'root'
}

export type CarouselControl = 'arrows' | 'dots' | 'counter' | 'thumbnails'
