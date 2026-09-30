import type { PhotoItem } from '@lupinum/vue-photo'

// One photo set for the docs and the playground. The images live in ./images;
// each app links that folder into its public directory as /photos.

function localPhoto(
  id: string,
  width: number,
  height: number,
  alt: string,
  caption: string,
  description: string,
  meta?: Record<string, unknown>,
): PhotoItem {
  return {
    id,
    src: `/photos/${id}.jpg`,
    width,
    height,
    alt,
    caption,
    description,
    meta,
  }
}

export const demoPhotos: PhotoItem[] = [
  localPhoto(
    'moss-canyon',
    1280,
    800,
    'River canyon with moss-covered walls',
    'Moss Canyon',
    'A river cuts through steep canyon walls covered in green moss.',
    { span: 'wide' },
  ),
  localPhoto(
    'seed-heads',
    960,
    1200,
    'Dandelion seed heads in evening light',
    'Seed Heads',
    'Dandelion clocks catch the low evening sun in a wide meadow.',
  ),
  localPhoto(
    'paper-wall',
    1280,
    854,
    'Wall covered in open book pages',
    'Paper Wall',
    'Hundreds of open pages pinned side by side into one wall.',
  ),
  localPhoto(
    'forest-tulips',
    1200,
    800,
    'Orange tulips at the edge of a forest',
    'Forest Tulips',
    'Orange tulips glow in the soft light between the trees.',
  ),
  localPhoto(
    'above-the-clouds',
    960,
    1200,
    'Sea of clouds under a blue sky',
    'Above the Clouds',
    'A layer of clouds stretches to the horizon under a clear sky.',
    { span: 'tall' },
  ),
  localPhoto(
    'fog-road',
    1280,
    880,
    'Road through tall trees in fog',
    'Fog Road',
    'A quiet road disappears into the fog between tall trees.',
  ),
  localPhoto(
    'city-at-dusk',
    1200,
    800,
    'City skyline at dusk under a dramatic sky',
    'City at Dusk',
    'The skyline lights up under a heavy evening sky.',
    { featured: true },
  ),
  localPhoto(
    'yellow-house',
    918,
    1200,
    'Bicycle in front of a yellow shopfront',
    'Yellow House',
    'A bicycle rests outside a yellow shopfront under the trees.',
  ),
  localPhoto(
    'green-ridge',
    1280,
    720,
    'Green mountain ridge with a footpath',
    'Green Ridge',
    'A footpath climbs toward a grassy ridge on a clear afternoon.',
  ),
  localPhoto(
    'amber-grass',
    1200,
    1200,
    'Tall grass backlit by the setting sun',
    'Amber Grass',
    'The setting sun shines through tall grass in warm amber tones.',
    { span: '2x2' },
  ),
  localPhoto(
    'stone-field',
    1280,
    828,
    'Large stones in a green meadow',
    'Stone Field',
    'Old boulders rest in a meadow under a hazy sky.',
  ),
  localPhoto(
    'workshop',
    948,
    1200,
    'Tools and ropes hanging in a workshop',
    'Workshop',
    'Ropes, tools and old wood hang together in a dim workshop.',
  ),
]
