<template>
  <button
    ref="element"
    type="button"
    class="np-trigger"
    :data-np-photo-id="id"
    :aria-label="ariaLabel"
    v-bind="$attrs"
    @click="ctx.open(index, element)"
  >
    <slot :photo="photo" :index="index" :hidden="ctx.hiddenThumbnailId.value === id" />
  </button>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { PhotoItem } from '../core/index'
import { photoId } from '../core/photo/lookup'
import { useLightboxInject } from '../lightbox/inject'
import { useEagerLabels } from '../provide/labels'
import { LightboxThumbnailRegistryKey } from '../provide/keys'

const props = defineProps<{
  /** The photo this thumbnail opens. */
  photo: PhotoItem
  /** Position of `photo` in the provider's collection. */
  index: number
}>()

const id = computed(() => photoId(props.photo))
const ctx = useLightboxInject('PhotoTrigger')
const labels = useEagerLabels()
const element = ref<HTMLButtonElement | null>(null)

// A renderless LightboxProvider has no root to search, so triggers register themselves.
const registry = inject(LightboxThumbnailRegistryKey, null)
if (registry) {
  watch(
    [id, element],
    ([id, current], _, onCleanup) => {
      if (!current) return
      registry.set(id, current)
      onCleanup(() => {
        if (registry.get(id) === current) registry.delete(id)
      })
    },
    { immediate: true, flush: 'post' },
  )
}

const ariaLabel = computed(() => props.photo.alt || labels.viewPhoto(props.index + 1))
</script>
