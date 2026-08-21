import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const addComponent = vi.fn()
const addImports = vi.fn()
const addPlugin = vi.fn()
const addTemplate = vi.fn((template) => template)
const warn = vi.fn()
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
  addTemplate,
  createResolver,
  defineNuxtModule: (definition: unknown) => definition,
  hasNuxtModule,
  logger: { warn },
}))

function createNuxt() {
  const hooks = new Map<string, Array<() => void>>()

  return {
    hook(name: string, callback: () => void) {
      hooks.set(name, [...(hooks.get(name) ?? []), callback])
    },
    callHook(name: string) {
      for (const callback of hooks.get(name) ?? []) callback()
    },
    options: {
      appConfig: {} as Record<string, unknown>,
      css: [] as string[],
      vite: {
        optimizeDeps: { include: ['existing-dependency'] },
        server: { fs: { allow: ['/existing-root'] } },
      },
    },
  }
}

function pluginSources() {
  return addPlugin.mock.calls.map(([plugin]) => plugin.src)
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
    addTemplate.mockClear()
    createResolver.mockClear()
    resolvePath.mockClear()
    hasNuxtModule.mockReset()
    warn.mockReset()
  })

  it('declares Nuxt compatibility and a complete styled default', () => {
    expect(nuxtPhotoModule.meta.compatibility).toEqual({ nuxt: '^4.4.8' })
    expect(nuxtPhotoModule.defaults.css).toBe('all')
  })

  it('always registers the AppConfig defaults plugin without mutating AppConfig', async () => {
    const nuxt = createNuxt()
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(pluginSources()).toContain('/resolved/./runtime/defaults-plugin')
    expect(nuxt.options.appConfig).toEqual({})
  })

  it('silently falls back to native images in auto mode', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expect(pluginSources()).not.toContain('/resolved/./runtime/plugin')
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when auto mode cannot apply adapter-specific settings', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await nuxtPhotoModule.setup(
      { ...nuxtPhotoModule.defaults, image: { provider: 'auto', thumb: { quality: 70 } } },
      nuxt,
    )
    nuxt.callHook('modules:done')

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cannot take effect'))
  })

  it('warns when native mode receives adapter-specific settings', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      { ...nuxtPhotoModule.defaults, image: { provider: 'native', slide: { quality: 76 } } },
      nuxt,
    )

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ignored in native mode'))
    expect(pluginSources()).not.toContain('/resolved/./runtime/plugin')
  })

  it('requires @nuxt/image in explicit nuxt-image mode', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await nuxtPhotoModule.setup(
      { ...nuxtPhotoModule.defaults, image: { provider: 'nuxt-image' } },
      nuxt,
    )

    expect(() => nuxt.callHook('modules:done')).toThrow(/requires `@nuxt\/image`/)
  })

  it('passes generated adapter configuration directly to the image plugin', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    await nuxtPhotoModule.setup(
      {
        ...nuxtPhotoModule.defaults,
        image: {
          provider: 'nuxt-image',
          thumb: { sizes: '100vw', quality: 70 },
          slide: { widths: [480, 960], maxWidth: 960, quality: 76 },
        },
      },
      nuxt,
    )
    nuxt.callHook('modules:done')

    expect(pluginSources()).toContain('/resolved/./runtime/plugin')
    expect(addTemplate).toHaveBeenCalledOnce()
    const template = addTemplate.mock.calls[0]![0]
    expect(template.filename).toBe('nuxt-photo/image-config.mjs')
    expect(template.getContents()).toBe(
      'export default {"thumb":{"sizes":"100vw","quality":70},"slide":{"widths":[480,960],"maxWidth":960,"quality":76}}',
    )
    expect(nuxt.options.appConfig).toEqual({})
  })

  it('detects @nuxt/image after all modules finish', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    hasNuxtModule.mockReturnValue(true)
    nuxt.callHook('modules:done')

    expect(pluginSources()).toContain('/resolved/./runtime/plugin')
  })

  it('skips the image integration when disabled', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)

    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, image: false }, nuxt)
    nuxt.callHook('modules:done')

    expect(pluginSources()).not.toContain('/resolved/./runtime/plugin')
    expect(addTemplate).not.toHaveBeenCalled()
  })

  it.each([
    [{ css: 'everything' }, /`nuxtPhoto\.css` must be "none", "structure", or "all"/],
    [{ lightbox: { minZoom: 2 } }, /Unknown `nuxtPhoto\.lightbox`/],
    [{ image: { provider: 'cloud' } }, /`nuxtPhoto\.image\.provider`/],
    [{ image: { provider: 'auto', thumb: { quality: 0 } } }, /quality` must be between/],
    [{ image: { provider: 'auto', slide: { widths: [640, -1] } } }, /positive integers/],
    [{ components: { primitive: true } }, /Unknown `nuxtPhoto\.components\.primitive`/],
    [{ autoImports: null }, /must be a boolean or object/],
    [{ image: null }, /must be false or an object/],
    [{ csss: 'all' }, /Unknown `nuxtPhoto\.csss`/],
  ])('validates configuration before setup side effects', async (config, message) => {
    const nuxt = createNuxt()

    await expect(
      nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, ...config }, nuxt),
    ).rejects.toThrow(message)

    expect(addComponent).not.toHaveBeenCalled()
    expect(addImports).not.toHaveBeenCalled()
    expect(addPlugin).not.toHaveBeenCalled()
  })

  it('injects structure and theme CSS once by default', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.css).toEqual([
      '/resolved/@lupinum/vue-photo/dist/styles/lightbox-structure.css',
      '/resolved/@lupinum/vue-photo/dist/styles/album.css',
      '/resolved/@lupinum/vue-photo/dist/styles/photo-structure.css',
      '/resolved/@lupinum/vue-photo/dist/styles/carousel-structure.css',
      '/resolved/@lupinum/vue-photo/dist/styles/lightbox-theme.css',
      '/resolved/@lupinum/vue-photo/dist/styles/photo.css',
      '/resolved/@lupinum/vue-photo/dist/styles/carousel-theme.css',
    ])
  })

  it('keeps structure and none as explicit CSS opt-outs', async () => {
    const structureNuxt = createNuxt()
    const noneNuxt = createNuxt()

    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'structure' }, structureNuxt)
    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'none' }, noneNuxt)

    expect(structureNuxt.options.css).toHaveLength(4)
    expect(noneNuxt.options.css).toEqual([])
  })

  it('registers all five recipes and keeps primitives opt-in', async () => {
    const nuxt = createNuxt()
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addComponent.mock.calls.map(([component]) => component.name)).toEqual([
      'Lightbox',
      'Photo',
      'PhotoGroup',
      'PhotoAlbum',
      'PhotoCarousel',
    ])
  })

  it('registers primitives when requested and applies a component prefix', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(
      { ...nuxtPhotoModule.defaults, components: { prefix: 'Np', primitives: true } },
      nuxt,
    )

    const names = addComponent.mock.calls.map(([component]) => component.name)
    expect(names).toContain('NpPhoto')
    expect(names).toContain('NpLightboxRoot')
    expect(names).toContain('NpPhotoImage')
  })

  it('auto-imports the complete Vue composable surface', async () => {
    const nuxt = createNuxt()
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addImports).toHaveBeenCalledWith(
      ['useLightbox', 'provideLightbox', 'usePhotoLabels', 'providePhotoLabels', 'responsive'].map(
        (name) => ({ name, as: name, from: '@lupinum/nuxt-photo/app' }),
      ),
    )
  })

  it('does not mutate application-owned Vite configuration', async () => {
    const nuxt = createNuxt()
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(nuxt.options.vite.server.fs.allow).toEqual(['/existing-root'])
    expect(nuxt.options.vite.optimizeDeps.include).toEqual(['existing-dependency'])
  })
})
