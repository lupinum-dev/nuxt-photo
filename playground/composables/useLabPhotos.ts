import { labAlt } from '../lab/photos'

/** The nonce belongs to the page payload, so SSR and hydration use identical sources. */
export async function useLabPhotos() {
  const route = useRoute()
  const nonce = useState('lab-cold-nonce', () => crypto.randomUUID())
  const photos = await usePhotoFolder('lab', { alt: labAlt })
  return computed(() =>
    route.query.cold === '1'
      ? photos.value.map((photo) => ({
          ...photo,
          src: `/__lab_cold/${nonce.value}${photo.src}`,
          ...(photo.thumbSrc && { thumbSrc: `/__lab_cold/${nonce.value}${photo.thumbSrc}` }),
        }))
      : photos.value,
  )
}
