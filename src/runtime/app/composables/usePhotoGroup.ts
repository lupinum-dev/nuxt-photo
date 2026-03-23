import { computed, getCurrentInstance, onBeforeUnmount, shallowReactive } from 'vue'
import type { Ref } from 'vue'
import type { LightboxImageItem, LightboxOptions, PhotoPoint } from '../../types'

type GroupEntry = {
  id: symbol
  item: Ref<LightboxImageItem>
  thumbnailElement: Ref<HTMLElement | null>
}

type GroupController = {
  open?: (
    index?: number,
    options?: LightboxOptions,
    sourceElement?: HTMLElement | null,
    initialPointerPos?: PhotoPoint | null,
  ) => boolean
  close?: () => void
}

type GroupState = {
  entries: GroupEntry[]
  hostId: symbol | null
  controller: GroupController
}

const PHOTO_GROUPS_KEY = Symbol('nuxt-photo.groups')

function getGroupsRegistry() {
  const instance = getCurrentInstance()
  if (!instance) {
    throw new Error('usePhotoGroup must be called during component setup.')
  }

  const provides = instance.appContext.provides as Record<PropertyKey, unknown>
  const existing = provides[PHOTO_GROUPS_KEY] as Map<string, GroupState> | undefined

  if (existing) {
    return existing
  }

  const registry = new Map<string, GroupState>()
  provides[PHOTO_GROUPS_KEY] = registry
  return registry
}

function getGroupState(groupId: string): GroupState {
  const registry = getGroupsRegistry()
  let state = registry.get(groupId)
  if (!state) {
    state = {
      controller: {},
      entries: shallowReactive([]),
      hostId: null,
    }
    registry.set(groupId, state)
  }
  return state
}

export function usePhotoGroup(
  groupId: string,
  item: Ref<LightboxImageItem>,
  thumbnailElement: Ref<HTMLElement | null>,
) {
  const entryId = Symbol(groupId)
  const state = getGroupState(groupId)
  const registry = getGroupsRegistry()
  const entry: GroupEntry = {
    id: entryId,
    item,
    thumbnailElement,
  }

  state.entries.push(entry)
  if (!state.hostId) {
    state.hostId = entryId
  }

  onBeforeUnmount(() => {
    const index = state.entries.findIndex(candidate => candidate.id === entryId)
    if (index >= 0) {
      state.entries.splice(index, 1)
    }

    if (state.hostId === entryId) {
      state.hostId = state.entries[0]?.id ?? null
    }

    if (state.entries.length === 0) {
      registry.delete(groupId)
    }
  })

  const isHost = computed(() => state.hostId === entryId)
  const items = computed(() => state.entries.map(candidate => candidate.item.value))
  const ownIndex = computed(() =>
    state.entries.findIndex(candidate => candidate.id === entryId),
  )

  function getThumbnailElement(index: number) {
    return state.entries[index]?.thumbnailElement.value ?? null
  }

  function registerController(controller: GroupController | null) {
    if (!isHost.value) {
      return
    }

    state.controller = controller ?? {}
  }
  function open(
    options?: LightboxOptions,
    sourceElement?: HTMLElement | null,
    initialPointerPos?: PhotoPoint | null,
  ) {
    if (ownIndex.value < 0) {
      return false
    }

    return state.controller.open?.(ownIndex.value, options, sourceElement, initialPointerPos)
  }

  return {
    getThumbnailElement,
    isHost,
    items,
    open,
    registerController,
  }
}
