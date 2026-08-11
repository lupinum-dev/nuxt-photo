import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const addComponent = vi.fn()
const addImports = vi.fn()
const addPlugin = vi.fn()
const resolvePath = vi.fn(async (path: string) => `/resolved/${path}/dist/index.mjs`)
const createResolver = vi.fn(() => ({
  resolve: (path: string) => `/resolved/${path}`,
  resolvePath,
}))
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
  const hooks = new Map<string, Array<(...args: any[]) => void>>()

  return {
    hook(name: string, callback: (...args: any[]) => void) {
      const callbacks = hooks.get(name) ?? []
      callbacks.push(callback)
      hooks.set(name, callbacks)
    },
    callHook(name: string, ...args: any[]) {
      for (const callback of hooks.get(name) ?? []) {
        callback(...args)
      }
    },
    options: {
      appConfig: {} as Record<string, any>,
      css: [] as string[],
      vite: {
        optimizeDeps: {
          include: ['existing-dependency'],
        },
        server: {
          fs: {
            allow: ['/existing-root'],
          },
        },
      },
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
    resolvePath.mockClear()
    hasNuxtModule.mockReset()
  })

  it('declares Nuxt compatibility through module metadata', () => {
    expect(nuxtPhotoModule.meta.compatibility).toEqual({
      nuxt: '^4.4.8',
    })
  })

  it('does not register the image plugin in native mode', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: { provider: 'native' },
      },
      nuxt,
    )

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('registers the nuxt image plugin when explicitly enabled', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: { provider: 'nuxt-image' },
      },
      nuxt,
    )

    nuxt.callHook('modules:done')

    expect(addPlugin).toHaveBeenCalledWith(
      {
        src: '/resolved/./runtime/plugin',
      },
      {
        append: true,
      },
    )
  })

  it('stores configurable nuxt image adapter defaults in app config', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: {
          provider: 'nuxt-image',
          thumb: { sizes: 'sm:100vw lg:320px', quality: 70 },
          slide: {
            widths: [480, 960],
            maxWidth: 960,
            maxDensity: 1,
            sizes: '90vw',
            quality: 76,
          },
        },
      },
      nuxt,
    )

    expect(nuxt.options.appConfig.nuxtPhoto.image).toEqual({
      thumb: { sizes: 'sm:100vw lg:320px', quality: 70 },
      slide: {
        widths: [480, 960],
        maxWidth: 960,
        maxDensity: 1,
        sizes: '90vw',
        quality: 76,
      },
    })
  })

  it('registers the defaults plugin when lightbox defaults are configured', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        lightbox: { minZoom: 2 },
      },
      nuxt,
    )

    expect(addPlugin).toHaveBeenCalledWith(
      {
        src: '/resolved/./runtime/defaults-plugin',
      },
      {
        append: true,
      },
    )
    expect(nuxt.options.appConfig).toEqual({
      nuxtPhoto: {
        lightbox: {
          minZoom: 2,
        },
      },
    })
  })

  it('throws when nuxt image mode is requested without @nuxt/image', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await expect(
      nuxtPhotoModule.setup(
        {
          ...nuxtPhotoModule.defaults,
          image: { provider: 'nuxt-image' },
        },
        nuxt,
      ),
    ).rejects.toThrow(/requires `@nuxt\/image`/)
  })

  it.each([
    ['css', { css: 'everything' }, /`nuxtPhoto\.css` must be "none", "structure", or "all"/],
    [
      'image provider',
      { image: { provider: 'cloud' } },
      /`nuxtPhoto\.image\.provider` must be "auto", "nuxt-image", or "native"/,
    ],
    [
      'thumb quality',
      { image: { provider: 'native', thumb: { quality: 0 } } },
      /`nuxtPhoto\.image\.thumb\.quality` must be between 1 and 100/,
    ],
    [
      'slide widths',
      { image: { provider: 'native', slide: { widths: [640, -1] } } },
      /`nuxtPhoto\.image\.slide\.widths` must be a non-empty array of positive integers/,
    ],
    [
      'slide maxWidth',
      { image: { provider: 'native', slide: { maxWidth: 0 } } },
      /`nuxtPhoto\.image\.slide\.maxWidth` must be greater than 0/,
    ],
    [
      'slide maxDensity',
      { image: { provider: 'native', slide: { maxDensity: Number.NaN } } },
      /`nuxtPhoto\.image\.slide\.maxDensity` must be a finite number/,
    ],
    [
      'lightbox minZoom',
      { lightbox: { minZoom: -1 } },
      /`nuxtPhoto\.lightbox\.minZoom` must be greater than 0/,
    ],
    [
      'component prefix',
      { components: { prefix: 1 } },
      /`nuxtPhoto\.components\.prefix` must be a string/,
    ],
    [
      'auto import prefix',
      { autoImports: { prefix: 1 } },
      /`nuxtPhoto\.autoImports\.prefix` must be a string/,
    ],
    [
      'null auto imports',
      { autoImports: null },
      /`nuxtPhoto\.autoImports` must be a boolean or object/,
    ],
    [
      'null components',
      { components: null },
      /`nuxtPhoto\.components` must be a boolean or object/,
    ],
    ['null image', { image: null }, /`nuxtPhoto\.image` must be false or an object/],
    [
      'array auto imports',
      { autoImports: [] },
      /`nuxtPhoto\.autoImports` must be a boolean or object/,
    ],
    ['array components', { components: [] }, /`nuxtPhoto\.components` must be a boolean or object/],
    ['array image', { image: [] }, /`nuxtPhoto\.image` must be false or an object/],
    [
      'array thumb options',
      { image: { provider: 'native', thumb: [] } },
      /`nuxtPhoto\.image\.thumb` must be an object/,
    ],
    [
      'array slide options',
      { image: { provider: 'native', slide: [] } },
      /`nuxtPhoto\.image\.slide` must be an object/,
    ],
    ['array lightbox', { lightbox: [] }, /`nuxtPhoto\.lightbox` must be an object/],
    ['unknown root option', { csss: 'all' }, /Unknown `nuxtPhoto\.csss`/],
    [
      'unknown component option',
      { components: { primitive: true } },
      /Unknown `nuxtPhoto\.components\.primitive`/,
    ],
    [
      'unknown image option',
      { image: { provider: 'native', slied: {} } },
      /Unknown `nuxtPhoto\.image\.slied`/,
    ],
  ])('validates invalid %s config before setup side effects', async (_name, config, message) => {
    const nuxt = createNuxt()

    await expect(
      nuxtPhotoModule.setup(
        {
          ...nuxtPhotoModule.defaults,
          ...(config as any),
        },
        nuxt,
      ),
    ).rejects.toThrow(message)

    expect(addComponent).not.toHaveBeenCalled()
    expect(addImports).not.toHaveBeenCalled()
    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('injects structure-only CSS by default (no theme)', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.css).toEqual([
      '/resolved/@nuxt-photo/vue/dist/styles/lightbox-structure.css',
      '/resolved/@nuxt-photo/vue/dist/styles/album.css',
      '/resolved/@nuxt-photo/vue/dist/styles/photo-structure.css',
      '/resolved/@nuxt-photo/vue/dist/styles/carousel-structure.css',
    ])
  })

  it('injects all CSS (structure + theme) with css: "all"', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'all' }, nuxt)

    expect(nuxt.options.css).toEqual([
      '/resolved/@nuxt-photo/vue/dist/styles/lightbox-structure.css',
      '/resolved/@nuxt-photo/vue/dist/styles/album.css',
      '/resolved/@nuxt-photo/vue/dist/styles/photo-structure.css',
      '/resolved/@nuxt-photo/vue/dist/styles/carousel-structure.css',
      '/resolved/@nuxt-photo/vue/dist/styles/lightbox-theme.css',
      '/resolved/@nuxt-photo/vue/dist/styles/photo.css',
      '/resolved/@nuxt-photo/vue/dist/styles/carousel-theme.css',
    ])
  })

  it('does not mutate application-owned Vite config', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.vite.server.fs.allow).toEqual(['/existing-root'])
    expect(nuxt.options.vite.optimizeDeps.include).toEqual(['existing-dependency'])
  })

  it('skips component registration when disabled', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        components: false,
      },
      nuxt,
    )

    expect(addComponent).not.toHaveBeenCalled()
  })

  it('registers unprefixed components by default', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(resolvePath).toHaveBeenCalledWith('@nuxt-photo/vue')
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Photo',
        filePath: '/resolved/@nuxt-photo/vue/dist/components/Photo.vue',
      }),
    )
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhotoAlbum',
        filePath: '/resolved/@nuxt-photo/vue/dist/components/PhotoAlbum.vue',
      }),
    )
    expect(addComponent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'LightboxRoot',
      }),
    )
    expect(addComponent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'LightboxProvider',
      }),
    )
    expect(addComponent).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'Lightbox' }))
  })

  it('registers primitives only when explicitly enabled', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        components: { primitives: true },
      },
      nuxt,
    )

    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'LightboxRoot',
        filePath: '/resolved/@nuxt-photo/vue/dist/primitives/LightboxRoot.vue',
      }),
    )
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhotoImage',
        filePath: '/resolved/@nuxt-photo/vue/dist/primitives/PhotoImage.vue',
      }),
    )
  })

  it('registers components with custom prefix', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        components: { prefix: 'Np' },
      },
      nuxt,
    )

    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NpPhoto',
        filePath: '/resolved/@nuxt-photo/vue/dist/components/Photo.vue',
      }),
    )
    expect(addComponent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NpLightboxRoot',
      }),
    )
    expect(addComponent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NpLightboxProvider',
      }),
    )
  })

  it('auto-detects @nuxt/image when provider is auto (default)', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expect(addPlugin).toHaveBeenCalledWith(
      {
        src: '/resolved/./runtime/plugin',
      },
      {
        append: true,
      },
    )
  })

  it('falls back to native when @nuxt/image is not installed (auto mode)', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('skips image provider entirely when image: false', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: false,
      },
      nuxt,
    )

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('only auto-imports vue composables', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addImports).toHaveBeenCalledWith([
      {
        name: 'useLightbox',
        as: 'useLightbox',
        from: '@nuxt-photo/nuxt/app',
      },
      {
        name: 'useLightboxProvider',
        as: 'useLightboxProvider',
        from: '@nuxt-photo/nuxt/app',
      },
      {
        name: 'responsive',
        as: 'responsive',
        from: '@nuxt-photo/nuxt/app',
      },
    ])
  })

  it('registers auto-imports with an opt-in prefix', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        autoImports: { prefix: 'Np' },
      },
      nuxt,
    )

    expect(addImports).toHaveBeenCalledWith([
      {
        name: 'useLightbox',
        as: 'useNpLightbox',
        from: '@nuxt-photo/nuxt/app',
      },
      {
        name: 'useLightboxProvider',
        as: 'useNpLightboxProvider',
        from: '@nuxt-photo/nuxt/app',
      },
      {
        name: 'responsive',
        as: 'npResponsive',
        from: '@nuxt-photo/nuxt/app',
      },
    ])
  })
})
