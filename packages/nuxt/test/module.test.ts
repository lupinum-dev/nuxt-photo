import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import manifest from '../package.json'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import type { NuxtPhotoOptions } from '../src/options'

const addTemplate = vi.fn()
const updateTemplates = vi.fn()
const addComponent = vi.fn()
const addImports = vi.fn()
const addPlugin = vi.fn()
const addVitePlugin = vi.fn()
const addTypeTemplate = vi.fn()
const loggerWarn = vi.fn()
const resolvePath = vi.fn(async (path: string) => `/resolved/${path}/dist/index.mjs`)
const createResolver = vi.fn(() => ({
  resolve: (path: string) => `/resolved/${path}`,
  resolvePath,
}))
const hasNuxtModule = vi.fn()

function expectNoImagePlugin() {
  expect(addPlugin).not.toHaveBeenCalledWith(
    { src: '/resolved/./runtime/plugin' },
    { append: true },
  )
}

vi.mock('@nuxt/kit', () => ({
  addComponent,
  addTemplate,
  updateTemplates,
  addImports,
  addPlugin,
  addVitePlugin,
  addTypeTemplate,
  createResolver,
  defineNuxtModule: (definition: unknown) => definition,
  hasNuxtModule,
  useLogger: () => ({ warn: loggerWarn }),
}))

function createNuxt() {
  type HookCallback = (...args: unknown[]) => void | Promise<void>
  const hooks = new Map<string, HookCallback[]>()

  return {
    hook(name: string, callback: HookCallback) {
      const callbacks = hooks.get(name) ?? []
      callbacks.push(callback)
      hooks.set(name, callbacks)
    },
    callHook(name: string, ...args: unknown[]) {
      for (const callback of hooks.get(name) ?? []) {
        void callback(...args)
      }
    },
    async callHookAsync(name: string, ...args: unknown[]) {
      for (const callback of hooks.get(name) ?? []) await callback(...args)
    },
    options: {
      app: { baseURL: '/' },
      rootDir: '/fixture',
      srcDir: '/fixture/app',
      dir: { public: '/fixture/public' },
      dev: false,
      watch: [] as string[],
      appConfig: {} as Record<string, unknown> & { nuxtPhoto: Record<string, unknown> },
      css: [] as string[],
      i18n: { locales: [] as unknown[] },
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

type TestModuleDefinition = {
  meta: { compatibility: { nuxt: string } }
  defaults: NuxtPhotoOptions
  setup: (options: NuxtPhotoOptions, nuxt: ReturnType<typeof createNuxt>) => Promise<void>
}

let nuxtPhotoModule: TestModuleDefinition
describe('nuxt-photo module', () => {
  beforeAll(async () => {
    nuxtPhotoModule = (await import('../src/module')).default as unknown as TestModuleDefinition
  })

  beforeEach(() => {
    addTemplate.mockReset().mockImplementation((template) => ({
      ...template,
      dst: `/fixture/.nuxt/${template.filename}`,
    }))
    updateTemplates.mockReset()
    addComponent.mockReset()
    addImports.mockReset()
    addPlugin.mockReset()
    addVitePlugin.mockReset()
    addTypeTemplate.mockReset()
    loggerWarn.mockReset()
    createResolver.mockClear()
    resolvePath.mockClear()
    hasNuxtModule.mockReset()
  })

  // Catches an English-only i18n catalog or shipping unused translations to every app.
  it.each([
    { i18n: false, locales: [], labels: undefined, expected: ['en'] },
    { i18n: true, locales: ['de', 'fr'], labels: undefined, expected: ['en', 'de', 'fr'] },
    {
      i18n: true,
      locales: [{ code: 'de-AT' }, { code: 'fr' }, 'unknown', 'de'],
      labels: { close: 'Custom' },
      expected: ['en', 'de', 'fr'],
    },
    { i18n: true, locales: ['de', 'fr'], labels: 'he', expected: ['en', 'he'] },
  ] as const)('bundles exactly $expected locales', async ({ i18n, locales, labels, expected }) => {
    const nuxt = createNuxt()
    nuxt.options.i18n.locales = [...locales]
    hasNuxtModule.mockImplementation((name) => name === '@nuxtjs/i18n' && i18n)
    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, labels }, nuxt)
    nuxt.callHook('modules:done')
    const template = addTemplate.mock.calls.find(
      ([t]) => t.filename === 'nuxt-photo-locales.mjs',
    )![0]
    const catalog = JSON.parse(template.getContents().slice('export default '.length))
    expect(Object.keys(catalog)).toEqual(expected)
    for (const values of Object.values(catalog)) expect(values).toHaveLength(14)
    expect(catalog.en[0]).toBe('Photo viewer')
    const plugin = addVitePlugin.mock.calls[0]![0]
    expect(
      plugin.resolveId(
        './photoLocaleTemplates.mjs',
        '/resolved/@lupinum/vue-photo/dist/provide/labels.mjs',
      ),
    ).toBe('/fixture/.nuxt/nuxt-photo-locales.mjs')
    expect(
      plugin.resolveId('./other.mjs', '/resolved/@lupinum/vue-photo/dist/provide/labels.mjs'),
    ).toBeUndefined()
    expect(
      addTemplate.mock.calls
        .find(([t]) => t.filename === 'nuxt-photo-internals.mjs')![0]
        .getContents(),
    ).toBe(
      'export { installPhotoConfig } from "/resolved/@lupinum/vue-photo/dist/config/install.mjs"',
    )
  })

  it('generates the local lookup and updates only its template on public asset changes', async () => {
    const publicDir = await mkdtemp(join(tmpdir(), 'nuxt-photo-watch-'))
    const nuxt = createNuxt()
    nuxt.options.dir.public = publicDir
    nuxt.options.dev = true
    addTemplate.mockImplementation((template) => template)
    try {
      await writeFile(join(publicDir, 'photo.svg'), '<svg width="8" height="4"/>')
      await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, localImages: true }, nuxt)
      const template = addTemplate.mock.calls.find(
        ([t]) => t.filename === 'nuxt-photo-local-images.mjs',
      )![0]
      expect(template.getContents()).toBe('export default Object.freeze({"/photo.svg":[8,4]})')
      expect(nuxt.options.watch).toEqual([publicDir])
      nuxt.callHook('modules:done')
      expect(
        addTemplate.mock.calls
          .find(([t]) => t.filename === 'nuxt-photo-config.mjs')![0]
          .getContents(),
      ).toContain('createLocalImageDimensionsResolver(manifest')
      await nuxt.callHookAsync('builder:watch', 'change', '/fixture/app/page.vue')
      expect(updateTemplates).not.toHaveBeenCalled()
      await writeFile(join(publicDir, '..photo.svg'), '<svg width="2" height="1"/>')
      await nuxt.callHookAsync('builder:watch', 'add', join(publicDir, '..photo.svg'))
      expect(template.getContents()).toContain('"/..photo.svg":[2,1]')
      await rm(join(publicDir, '..photo.svg'))
      await nuxt.callHookAsync('builder:watch', 'unlink', join(publicDir, '..photo.svg'))
      await writeFile(join(publicDir, 'photo.svg'), '<svg width="12" height="6"/>')
      await nuxt.callHookAsync('builder:watch', 'change', join(publicDir, 'photo.svg'))
      expect(template.getContents()).toBe('export default Object.freeze({"/photo.svg":[12,6]})')
      await writeFile(join(publicDir, 'new.svg'), '<svg width="3" height="2"/>')
      await nuxt.callHookAsync('builder:watch', 'add', join(publicDir, 'new.svg'))
      expect(template.getContents()).toContain('"/new.svg":[3,2]')
      await rm(join(publicDir, 'photo.svg'))
      await nuxt.callHookAsync('builder:watch', 'unlink', join(publicDir, 'photo.svg'))
      expect(template.getContents()).toBe('export default Object.freeze({"/new.svg":[3,2]})')
      expect(updateTemplates).toHaveBeenCalledTimes(5)
      const { filter } = updateTemplates.mock.calls[0]![0]
      expect(filter({ filename: template.filename })).toBe(true)
      expect(filter({ filename: 'unrelated.mjs' })).toBe(false)
    } finally {
      await rm(publicDir, { recursive: true, force: true })
    }
  })

  it('declares Nuxt compatibility through module metadata', () => {
    expect(nuxtPhotoModule.meta.compatibility).toEqual({
      nuxt: manifest.peerDependencies.nuxt,
    })
  })

  it('uses generated options and ignores runtime app config', async () => {
    const nuxt = createNuxt()
    const old = { labels: { close: 'Old app config' } }
    nuxt.options.appConfig.nuxtPhoto = old
    await nuxtPhotoModule.setup(
      { ...nuxtPhotoModule.defaults, labels: { close: 'Module label' } },
      nuxt,
    )
    nuxt.callHook('modules:done')
    expect(addTypeTemplate).not.toHaveBeenCalled()
    expect(nuxt.options.appConfig.nuxtPhoto).toBe(old)
    const template = addTemplate.mock.calls.find(
      ([t]) => t.filename === 'nuxt-photo-options.mjs',
    )![0]
    expect(template.getContents()).toContain('"close":"Module label"')
    expect(template.getContents()).not.toContain('Old app config')
    expect(addPlugin).toHaveBeenCalledWith(
      { src: '/resolved/./runtime/defaults-plugin' },
      { append: true },
    )
  })

  it('selects a named provider when Nuxt Image is installed', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(true)
    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, provider: 'vercel' }, nuxt)
    nuxt.callHook('modules:done')
    expect(addPlugin).toHaveBeenCalledWith({ src: '/resolved/./runtime/plugin' }, { append: true })
    const template = addTemplate.mock.calls.find(
      ([t]) => t.filename === 'nuxt-photo-options.mjs',
    )![0]
    expect(template.getContents()).toContain('"provider":"vercel"')
    expect(template.getContents()).not.toContain('"image":')
  })

  it('rejects a named provider without Nuxt Image', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)
    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, provider: 'vercel' }, nuxt)
    expect(() => nuxt.callHook('modules:done')).toThrow(/requires @nuxt\/image/)
  })

  it.each([
    ['local images', { localImages: 'true' }, /`nuxtPhoto\.localImages` must be a boolean/],
    ['css', { css: 'everything' }, /`nuxtPhoto\.css` must be "none", "structure", or "all"/],
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
    [
      'array auto imports',
      { autoImports: [] },
      /`nuxtPhoto\.autoImports` must be a boolean or object/,
    ],
    ['array components', { components: [] }, /`nuxtPhoto\.components` must be a boolean or object/],
    ['array lightbox', { lightbox: [] }, /`nuxtPhoto\.lightbox` must be an object/],
    ['array labels', { labels: [] }, /`nuxtPhoto\.labels` must be an object/],
    ['invalid label', { labels: { close: 1 } }, /`nuxtPhoto\.labels\.close` must be a string/],
    ['unknown label', { labels: { dismiss: 'Close' } }, /Unknown `nuxtPhoto\.labels\.dismiss`/],
    ['unknown root option', { csss: 'all' }, /Unknown `nuxtPhoto\.csss`/],
    [
      'unknown component option',
      { components: { primitive: true } },
      /Unknown `nuxtPhoto\.components\.primitive`/,
    ],
    ['removed image', { image: {} }, /Unknown `nuxtPhoto\.image`/],
  ])('validates invalid %s config before setup side effects', async (_name, config, message) => {
    const nuxt = createNuxt()

    await expect(
      nuxtPhotoModule.setup(
        {
          ...nuxtPhotoModule.defaults,
          ...(config as unknown as Partial<NuxtPhotoOptions>),
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
      '/resolved/@lupinum/vue-photo/dist/styles/lightbox-structure.css',
      '/resolved/@lupinum/vue-photo/dist/styles/album.css',
      '/resolved/@lupinum/vue-photo/dist/styles/photo-structure.css',
      '/resolved/@lupinum/vue-photo/dist/styles/carousel-structure.css',
    ])
  })

  it('injects all CSS (structure + theme) with css: "all"', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup({ ...nuxtPhotoModule.defaults, css: 'all' }, nuxt)

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

    expect(resolvePath).toHaveBeenCalledWith('@lupinum/vue-photo')
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Photo',
        filePath: '/resolved/@lupinum/vue-photo/dist/components/Photo.vue',
      }),
    )
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhotoAlbum',
        filePath: '/resolved/@lupinum/vue-photo/dist/components/PhotoAlbum.vue',
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
        filePath: '/resolved/@lupinum/vue-photo/dist/primitives/LightboxRoot.vue',
      }),
    )
    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhotoImage',
        filePath: '/resolved/@lupinum/vue-photo/dist/primitives/PhotoImage.vue',
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
        filePath: '/resolved/@lupinum/vue-photo/dist/components/Photo.vue',
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

  it('detects Nuxt Image installed later in module order', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)
    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    expectNoImagePlugin()
    hasNuxtModule.mockReturnValue(true)
    nuxt.callHook('modules:done')
    expect(addPlugin).toHaveBeenCalledOnce()
    expect(addPlugin).toHaveBeenCalledWith({ src: '/resolved/./runtime/plugin' }, { append: true })
  })

  it('falls back to native when @nuxt/image is not installed (auto mode)', async () => {
    const nuxt = createNuxt()
    hasNuxtModule.mockReturnValue(false)

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)
    nuxt.callHook('modules:done')

    expectNoImagePlugin()
  })

  it('only auto-imports vue composables', async () => {
    const nuxt = createNuxt()

    await nuxtPhotoModule.setup(nuxtPhotoModule.defaults, nuxt)

    expect(addImports).toHaveBeenCalledWith([
      {
        name: 'useLightbox',
        as: 'useLightbox',
        from: '@lupinum/nuxt-photo/app',
      },
      {
        name: 'usePhotoLabels',
        as: 'usePhotoLabels',
        from: '@lupinum/nuxt-photo/app',
      },
      {
        name: 'responsive',
        as: 'responsive',
        from: '@lupinum/nuxt-photo/app',
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
        from: '@lupinum/nuxt-photo/app',
      },
      {
        name: 'usePhotoLabels',
        as: 'useNpPhotoLabels',
        from: '@lupinum/nuxt-photo/app',
      },
      {
        name: 'responsive',
        as: 'npResponsive',
        from: '@lupinum/nuxt-photo/app',
      },
    ])
  })
})
