import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const addComponent = vi.fn()
const addImports = vi.fn()
const addPlugin = vi.fn()
const createResolver = vi.fn(() => ({
  resolve: (path: string) => `/resolved/${path}`,
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
    hasNuxtModule.mockReset()
  })

  it('declares Nuxt compatibility through module metadata', () => {
    expect(nuxtPhotoModule.meta.compatibility).toEqual({
      nuxt: '^4.0.0',
    })
  })

  it('does not register the image plugin in native mode', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: { provider: 'native' },
      },
      nuxt,
    )

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('registers the nuxt image plugin when explicitly enabled', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup(
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

  it('stores configurable nuxt image adapter defaults in app config', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup(
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

  it('registers the defaults plugin when lightbox defaults are configured', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(
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

  it('throws when nuxt image mode is requested without @nuxt/image', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    expect(() =>
      nuxtPhotoModule.setup(
        {
          ...nuxtPhotoModule.defaults,
          image: { provider: 'nuxt-image' },
        },
        nuxt,
      ),
    ).toThrow(/requires `@nuxt\/image`/)
  })

  it('injects structure-only CSS by default (no theme)', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.css).toEqual([
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/lightbox-structure\.css$/,
      ),
      expect.stringMatching(/packages\/vue\/dist\/styles\/album\.css$/),
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/photo-structure\.css$/,
      ),
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/carousel-structure\.css$/,
      ),
    ])
  })

  it('injects all CSS (structure + theme) with css: "all"', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'all' }, nuxt)

    expect(nuxt.options.css).toEqual([
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/lightbox-structure\.css$/,
      ),
      expect.stringMatching(/packages\/vue\/dist\/styles\/album\.css$/),
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/photo-structure\.css$/,
      ),
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/carousel-structure\.css$/,
      ),
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/lightbox-theme\.css$/,
      ),
      expect.stringMatching(/packages\/vue\/dist\/styles\/photo\.css$/),
      expect.stringMatching(
        /packages\/vue\/dist\/styles\/carousel-theme\.css$/,
      ),
    ])
  })

  it('allows linked Nuxt Photo package roots in Vite dev server config', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.vite.server.fs.allow).toEqual([
      '/existing-root',
      expect.stringMatching(/packages\/nuxt\/?$/),
      expect.stringMatching(/packages\/vue\/?$/),
    ])
    expect(nuxt.options.vite.optimizeDeps.include).toEqual([
      'existing-dependency',
      'embla-carousel',
      'embla-carousel-autoplay',
      'embla-carousel-vue',
    ])
  })

  it('skips component registration when disabled', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        components: false,
      },
      nuxt,
    )

    expect(addComponent).not.toHaveBeenCalled()
  })

  it('registers unprefixed components by default', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Photo',
        filePath: expect.stringMatching(
          /packages\/vue\/dist\/components\/Photo\.vue$/,
        ),
      }),
    )
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhotoAlbum',
        filePath: expect.stringMatching(
          /packages\/vue\/dist\/components\/PhotoAlbum\.vue$/,
        ),
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
    expect(addComponent).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Lightbox' }),
    )
  })

  it('registers primitives only when explicitly enabled', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        components: { primitives: true },
      },
      nuxt,
    )

    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'LightboxRoot',
        filePath: expect.stringMatching(
          /packages\/vue\/dist\/primitives\/LightboxRoot\.vue$/,
        ),
      }),
    )
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhotoImage',
        filePath: expect.stringMatching(
          /packages\/vue\/dist\/primitives\/PhotoImage\.vue$/,
        ),
      }),
    )
  })

  it('registers components with custom prefix', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        components: { prefix: 'Np' },
      },
      nuxt,
    )

    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NpPhoto',
        filePath: expect.stringMatching(
          /packages\/vue\/dist\/components\/Photo\.vue$/,
        ),
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

  it('auto-detects @nuxt/image when provider is auto (default)', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
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

  it('falls back to native when @nuxt/image is not installed (auto mode)', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('skips image provider entirely when image: false', () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: false,
      },
      nuxt,
    )

    nuxt.callHook('modules:done')

    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('only auto-imports vue composables', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

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

  it('registers auto-imports with an opt-in prefix', () => {
    const nuxt = createNuxt()

    nuxtPhotoModule.setup(
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
