<script setup lang="ts">
import { computed, ref } from 'vue'
import { docsAlbumSetA, docsAlbumSetB, docsAlbumSetC, docsDemoPhotos } from '~/composables/useDocsDemoData'

type GroupTab = 'auto' | 'albums' | 'explicit' | 'headless' | 'programmatic'
type PhotoTab = 'solo' | 'group' | 'ignore'

const props = withDefaults(defineProps<{
  scope?: 'group' | 'photo'
  initialTab?: string
}>(), {
  scope: 'group',
})

const groupTabItems = [
  { label: 'Auto', value: 'auto' },
  { label: 'Albums', value: 'albums' },
  { label: 'Explicit', value: 'explicit' },
  { label: 'Headless', value: 'headless' },
  { label: 'Programmatic', value: 'programmatic' },
]

const photoTabItems = [
  { label: 'Solo lightbox', value: 'solo' },
  { label: 'In group', value: 'group' },
  { label: 'Ignore', value: 'ignore' },
]

const activeGroupTab = ref<GroupTab>((props.scope === 'group' && props.initialTab
  ? props.initialTab
  : 'auto') as GroupTab)
const activePhotoTab = ref<PhotoTab>((props.scope === 'photo' && props.initialTab
  ? props.initialTab
  : 'solo') as PhotoTab)

const groupRef = ref<{ open: (photoOrIndex?: number) => Promise<void> } | null>(null)

const activeTab = computed(() => props.scope === 'photo' ? activePhotoTab.value : activeGroupTab.value)

const summary = computed(() => {
  if (props.scope === 'photo') {
    if (activePhotoTab.value === 'solo') return 'Single Photo with its own lightbox context.'
    if (activePhotoTab.value === 'group') return 'Photo instances auto-register into the parent PhotoGroup.'
    return 'lightbox-ignore removes a frame from the shared collection.'
  }

  if (activeGroupTab.value === 'auto') return 'Children register themselves in DOM order.'
  if (activeGroupTab.value === 'albums') return 'Multiple PhotoAlbum instances share one lightbox sequence.'
  if (activeGroupTab.value === 'explicit') return 'The group uses a provided array and slot API for programmatic open.'
  if (activeGroupTab.value === 'headless') return 'Custom markup keeps FLIP transitions via setThumbRef(i).'
  return 'Template refs can open the shared lightbox from outside the rendered gallery.'
})

const codeSnippet = computed(() => {
  if (props.scope === 'photo') {
    if (activePhotoTab.value === 'solo') {
      return `<Photo :photo="photo" lightbox />`
    }

    if (activePhotoTab.value === 'group') {
      return [
        '<PhotoGroup>',
        '  <Photo :photo="photo1" />',
        '  <Photo :photo="photo2" />',
        '  <Photo :photo="photo3" />',
        '</PhotoGroup>',
      ].join('\n')
    }

    return [
      '<PhotoGroup>',
      '  <Photo :photo="photo1" />',
      '  <Photo :photo="photo2" lightbox-ignore />',
      '  <Photo :photo="photo3" />',
      '</PhotoGroup>',
    ].join('\n')
  }

  if (activeGroupTab.value === 'auto') {
    return [
      '<PhotoGroup>',
      '  <Photo :photo="hero" />',
      '  <Photo :photo="detail1" />',
      '  <Photo :photo="detail2" />',
      '</PhotoGroup>',
    ].join('\n')
  }

  if (activeGroupTab.value === 'albums') {
    return [
      '<PhotoGroup>',
      '  <PhotoAlbum :photos="landscapes" layout="rows" />',
      '  <PhotoAlbum :photos="portraits" layout="columns" />',
      '  <PhotoAlbum :photos="abstract" layout="masonry" />',
      '</PhotoGroup>',
    ].join('\n')
  }

  if (activeGroupTab.value === 'explicit') {
    return [
      '<PhotoGroup :photos="photos" v-slot="{ open }">',
      '  <button @click="open(0)">Open first</button>',
      '</PhotoGroup>',
    ].join('\n')
  }

  if (activeGroupTab.value === 'headless') {
    return [
      '<PhotoGroup :photos="photos" v-slot="{ open, setThumbRef }">',
      '  <div v-for="(photo, i) in photos" :ref="setThumbRef(i)" @click="open(i)">',
      '    <img :src="photo.src" :alt="photo.alt" />',
      '  </div>',
      '</PhotoGroup>',
    ].join('\n')
  }

  return [
    '<PhotoGroup ref="groupRef">',
    '  <PhotoAlbum :photos="photos" />',
    '</PhotoGroup>',
    '',
    '<button @click="groupRef?.open(0)">Open gallery</button>',
  ].join('\n')
})
</script>

<template>
  <div class="not-prose my-8 border border-default rounded-2xl overflow-hidden bg-elevated shadow-xs">
    <div class="flex flex-wrap justify-between items-start gap-4 px-4 py-4 border-b border-default playground-header-bg">
      <div class="min-w-0">
        <h3 class="m-0 text-base font-bold text-highlighted">{{ props.scope === 'photo' ? 'Photo behaviors' : 'Collection playground' }}</h3>
        <p class="mt-1 max-w-3xl text-muted text-sm leading-relaxed">{{ summary }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UTabs
          v-if="props.scope === 'photo'"
          :model-value="activePhotoTab"
          :items="photoTabItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="activePhotoTab = $event as PhotoTab"
        />
        <UTabs
          v-else
          :model-value="activeGroupTab"
          :items="groupTabItems"
          variant="pill"
          size="sm"
          :content="false"
          value-key="value"
          label-key="label"
          @update:model-value="activeGroupTab = $event as GroupTab"
        />
      </div>
    </div>

    <div class="grid gap-4 p-4">
      <div class="grid gap-4">
        <div v-if="props.scope === 'photo' && activePhotoTab === 'solo'" class="grid gap-4">
          <Photo :photo="docsDemoPhotos[0]!" lightbox />
        </div>

        <div v-else-if="props.scope === 'photo' && activePhotoTab === 'group'" class="grid gap-4">
          <PhotoGroup>
            <div class="grid gap-3.5 grid-cols-3 max-sm:grid-cols-1">
              <Photo v-for="photo in docsDemoPhotos.slice(0, 3)" :key="photo.id" :photo="photo" />
            </div>
          </PhotoGroup>
        </div>

        <div v-else-if="props.scope === 'photo' && activePhotoTab === 'ignore'" class="grid gap-4">
          <PhotoGroup>
            <div class="grid gap-3.5 grid-cols-3 max-sm:grid-cols-1">
              <Photo :photo="docsDemoPhotos[0]!" />
              <Photo :photo="docsDemoPhotos[1]!" lightbox-ignore />
              <Photo :photo="docsDemoPhotos[2]!" />
            </div>
          </PhotoGroup>
        </div>

        <div v-else-if="activeGroupTab === 'auto'" class="grid gap-4">
          <PhotoGroup>
            <div class="grid gap-3.5 grid-cols-3 max-sm:grid-cols-1">
              <Photo v-for="photo in docsDemoPhotos.slice(0, 3)" :key="photo.id" :photo="photo" />
            </div>
          </PhotoGroup>
        </div>

        <div v-else-if="activeGroupTab === 'albums'" class="grid gap-4">
          <PhotoGroup>
            <section class="grid gap-2.5">
              <h4 class="m-0 text-highlighted">Landscapes</h4>
              <PhotoAlbum :photos="docsAlbumSetA" layout="rows" :spacing="8" />
            </section>
            <section class="grid gap-2.5">
              <h4 class="m-0 text-highlighted">Portraits</h4>
              <PhotoAlbum :photos="docsAlbumSetB" layout="columns" :spacing="8" />
            </section>
            <section class="grid gap-2.5">
              <h4 class="m-0 text-highlighted">Abstract</h4>
              <PhotoAlbum :photos="docsAlbumSetC" layout="masonry" :spacing="8" />
            </section>
          </PhotoGroup>
        </div>

        <div v-else-if="activeGroupTab === 'explicit'" class="grid gap-4">
          <PhotoGroup :photos="docsDemoPhotos.slice(0, 5)" v-slot="{ open }">
            <div class="grid gap-3.5">
              <UButton variant="outline" @click="open(0)">Open first</UButton>
              <UButton variant="soft" color="neutral" @click="open(2)">Jump to third</UButton>
              <div class="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                <button
                  v-for="(photo, index) in docsDemoPhotos.slice(0, 5)"
                  :key="photo.id"
                  type="button"
                  class="grid gap-1 p-3.5 border border-default rounded-2xl bg-elevated text-left text-highlighted cursor-pointer appearance-none card-hover"
                  @click="open(index)"
                >
                  <span>{{ photo.caption }}</span>
                  <small class="text-muted">{{ photo.width }} × {{ photo.height }}</small>
                </button>
              </div>
            </div>
          </PhotoGroup>
        </div>

        <div v-else-if="activeGroupTab === 'headless'" class="grid gap-4">
          <PhotoGroup :photos="docsDemoPhotos.slice(0, 6)" v-slot="{ open, setThumbRef }">
            <div class="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
              <button
                v-for="(photo, index) in docsDemoPhotos.slice(0, 6)"
                :key="photo.id"
                :ref="setThumbRef(index)"
                type="button"
                class="grid gap-2 p-1.5 border border-default rounded-2xl bg-elevated text-left text-highlighted cursor-pointer appearance-none card-hover"
                @click="open(index)"
              >
                <img :src="photo.thumbSrc || photo.src" :alt="photo.alt" class="w-full aspect-square object-cover rounded-xl">
                <span>{{ photo.caption }}</span>
              </button>
            </div>
          </PhotoGroup>
        </div>

        <div v-else class="grid gap-4">
          <div class="grid gap-3.5">
            <UButton variant="outline" @click="groupRef?.open(0)">Open gallery</UButton>
            <UButton variant="soft" color="neutral" @click="groupRef?.open(3)">Start at fourth photo</UButton>
          </div>
          <PhotoGroup ref="groupRef">
            <PhotoAlbum :photos="docsDemoPhotos.slice(0, 6)" layout="rows" :spacing="8" />
          </PhotoGroup>
        </div>
      </div>

      <div class="border border-default rounded-xl overflow-hidden bg-muted/40">
        <div class="flex justify-between items-center gap-4 px-3.5 py-2.5 border-b border-default text-muted text-xs font-medium uppercase tracking-wide">
          <span>{{ props.scope === 'photo' ? 'Photo usage' : 'PhotoGroup usage' }}</span>
          <UBadge variant="subtle" size="sm">{{ activeTab }}</UBadge>
        </div>
        <pre class="m-0 px-4 py-3.5 overflow-x-auto text-toned text-sm leading-relaxed font-mono"><code>{{ codeSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>
