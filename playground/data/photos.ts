import type {
  LightboxItem,
  PhotoItem,
} from '../../src/module'

export const albumItems: PhotoItem[] = [
  {
    key: 'coast',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=1100&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=550&fit=crop',
    alt: 'Ocean waves meeting a rocky coast',
    caption: 'Coast',
    description: 'Warm light over crashing waves along a rocky shoreline.',
    width: 1600,
    height: 1100,
  },
  {
    key: 'lake',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1500&h=1800&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&h=840&fit=crop',
    alt: 'Mountain lake with pine trees',
    caption: 'Lake',
    width: 1500,
    height: 1800,
  },
  {
    key: 'valley',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1800&h=1200&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&h=600&fit=crop',
    alt: 'Green valley with layered hills',
    caption: 'Valley',
    width: 1800,
    height: 1200,
  },
  {
    key: 'dunes',
    src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1400&h=1700&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&h=850&fit=crop',
    alt: 'Sand dunes at dusk',
    caption: 'Dunes',
    width: 1400,
    height: 1700,
  },
  {
    key: 'peak',
    src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&h=1300&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=650&fit=crop',
    alt: 'Snow covered peak in soft light',
    caption: 'Peak',
    width: 1800,
    height: 1300,
  },
  {
    key: 'forest',
    src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1500&h=1900&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=750&h=950&fit=crop',
    alt: 'Dense forest canopy',
    caption: 'Forest',
    width: 1500,
    height: 1900,
  },
  {
    key: 'desert',
    src: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=2000&h=1000&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1000&h=500&fit=crop',
    alt: 'Wide desert panorama at golden hour',
    caption: 'Desert',
    description: 'Ultra-wide panoramic view across a golden desert landscape.',
    width: 2000,
    height: 1000,
  },
  {
    key: 'waterfall',
    src: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b03?w=1200&h=1200&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b03?w=600&h=600&fit=crop',
    alt: 'Waterfall in a mossy gorge',
    caption: 'Waterfall',
    width: 1200,
    height: 1200,
  },
  {
    key: 'aurora',
    src: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1800&h=1200&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=900&h=600&fit=crop',
    alt: 'Northern lights over a snowy landscape',
    caption: 'Aurora',
    description: 'Green aurora borealis dancing above a frozen northern scene.',
    width: 1800,
    height: 1200,
  },
  {
    key: 'cliff',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=2100&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&h=1050&fit=crop',
    alt: 'Dramatic cliff face in fog',
    caption: 'Cliff',
    width: 1400,
    height: 2100,
  },
]

export function getGalleryItems() {
  return albumItems.slice(0, 6).map(item => ({
    ...item,
    msrc: item.thumbnailSrc,
    type: 'image' as const,
  }))
}

export function getCustomLightboxItems(): LightboxItem[] {
  return [
    {
      ...albumItems[0]!,
      msrc: albumItems[0]!.thumbnailSrc,
      type: 'image',
    },
    {
      ...albumItems[1]!,
      msrc: albumItems[1]!.thumbnailSrc,
      type: 'image',
    },
    {
      type: 'custom',
      id: 'info-slide',
      title: 'About This Collection',
      width: 1200,
      height: 800,
    },
    {
      ...albumItems[2]!,
      msrc: albumItems[2]!.thumbnailSrc,
      type: 'image',
    },
    {
      type: 'custom',
      id: 'credits-slide',
      title: 'Credits & License',
      width: 1200,
      height: 800,
    },
  ]
}
