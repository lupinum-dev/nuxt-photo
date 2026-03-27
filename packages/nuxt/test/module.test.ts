import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const addComponent = vi.fn()
const addImports = vi.fn()
const addPlugin = vi.fn()
const createResolver = vi.fn(() => ({ resolve: (path: string) => `/resolved/${path}` }))
const hasNuxtModule = vi.fn()

vi.mock('@nuxt/kit', () => ({
  addComponent,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule: (definition: unknown) => definition,
  hasNuxtModule,
}))

function createNuxt() {
  const hooks = new Map<string, Array<() => void>>()

  return {
    hook(name: string, callback: () => void) {
      const callbacks = hooks.get(name) ?? []
      callbacks.push(callback)
      hooks.set(name, callbacks)
    },
    callHook(name: string) {
      for (const callback of hooks.get(name) ?? []) {
        callback()
      }
    },
    options: {
      appConfig: {} as Record<string, any>,
      css: [] as string[],
    },
  }
}

let nuxtPhotoModule: Awaited<typeof import('../src/module')>['default']

describe('nuxt-photo module', () => {
  beforeAll(async () => {
    nuxtPhotoModule = (await import('../src/module')).default
  })

  beforeEach(() => {
    addComponent.mockReset()
    addImports.mockReset()
    addPlugin.mockReset()
    createResolver.mockClear()
    hasNuxtModule.mockReset()
  })

  it('does not register the image plugin in native mode', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: { provider: 'native' },
    }, nuxt)

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('registers the nuxt image plugin when explicitly enabled', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: { provider: 'nuxt-image' },
    }, nuxt)

    nuxt.callHook('modules:done')

    expect(addPlugin).toHaveBeenCalledWith({
      src: '/resolved/./runtime/plugin',
    }, {
      append: true,
    })
  })

  it('registers the defaults plugin when lightbox defaults are configured', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      lightbox: { minZoom: 2 },
    }, nuxt)

    expect(addPlugin).toHaveBeenCalledWith({
      src: '/resolved/./runtime/defaults-plugin',
    }, {
      append: true,
    })
    expect(nuxt.options.appConfig).toEqual({
      nuxtPhoto: {
        lightbox: {
          minZoom: 2,
        },
      },
    })
  })

  it('throws when nuxt image mode is requested without @nuxt/image', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    expect(() => nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      image: { provider: 'nuxt-image' },
    }, nuxt)).toThrow(/requires `@nuxt\/image`/)
  })

  it('injects structure-only CSS by default (no theme)', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.css).toEqual([
      '@nuxt-photo/recipes/styles/lightbox-structure.css',
      '@nuxt-photo/recipes/styles/album.css',
      '@nuxt-photo/recipes/styles/photo-structure.css',
    ])
  })

  it('injects all CSS (structure + theme) with css: "all"', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'all' }, nuxt)

    expect(nuxt.options.css).toEqual([
      '@nuxt-photo/recipes/styles/lightbox-structure.css',
      '@nuxt-photo/recipes/styles/album.css',
      '@nuxt-photo/recipes/styles/photo-structure.css',
      '@nuxt-photo/recipes/styles/lightbox-theme.css',
      '@nuxt-photo/recipes/styles/photo.css',
    ])
  })

  it('skips component registration when disabled', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({
      ...nuxtPhotoModule.defaults,
      components: false,
    }, nuxt)

    expect(addComponent).not.toHaveBeenCalled()
  })

  it('registers prefixed components by default', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'NuxtPhotoImage',
      export: 'Photo',
      filePath: '@nuxt-photo/recipes',
    }))
    expect(addComponent).toHaveBeenCalledWith(expect.objectContaining({
      name: 'NuxtPhotoImg',
      export: 'PhotoImage',
      filePath: '@nuxt-photo/vue',
    }))
    expect(addComponent).not.toHaveBeenCalledWith(expect.objectContaining({
      export: 'Lightbox',
      filePath: '@nuxt-photo/recipes',
    }))
  })

  it('only auto-imports vue composables', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addImports).toHaveBeenCalledWith([
      { name: 'useLightbox', from: '@nuxt-photo/vue' },
      { name: 'useLightboxProvider', from: '@nuxt-photo/vue' },
      { name: 'responsive', from: '@nuxt-photo/vue' },
    ])
  })
})
