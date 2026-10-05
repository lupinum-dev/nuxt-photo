// @vitest-environment jsdom
import { afterEach, expect, it } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { usePhotoLabels } from '@lupinum/vue-photo'
import { installPhotoConfig } from '../../vue/src/config/install'
import { resolveNuxtPhotoLocale, resolveNuxtPhotoLabels } from '../src/runtime/labels'

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = ''
})

// Catches a one-time locale snapshot, English-only Nuxt defaults, or lost label overrides.
it('follows the active i18n composer locale and keeps per-key overrides', async () => {
  document.documentElement.lang = 'he'
  const locale = ref('de-AT')
  let labelCount = 0
  const Consumer = defineComponent({
    setup() {
      const labels = usePhotoLabels()
      labelCount = Object.keys(labels).length
      return () => h('p', `${labels.close} / ${labels.next} / ${labels.slideStatus(2, 7)}`)
    },
  })
  const app = createApp(Consumer)
  installPhotoConfig(
    app,
    { labels: resolveNuxtPhotoLabels({ close: 'Custom close' }) },
    undefined,
    () => resolveNuxtPhotoLocale({ locale }),
  )
  const container = document.createElement('div')
  document.body.append(container)
  app.mount(container)
  try {
    expect(labelCount).toBe(18)
    expect(container.textContent).toBe('Custom close / Weiter / Bild 2 von 7')
    locale.value = 'fr'
    await nextTick()
    expect(container.textContent).toBe('Custom close / Suivant / Diapositive 2 sur 7')
    locale.value = 'pt-PT'
    await nextTick()
    expect(container.textContent).toBe('Custom close / Seguinte / Diapositivo 2 de 7')
    locale.value = 'pt-BR'
    await nextTick()
    expect(container.textContent).toBe('Custom close / Próximo / Slide 2 de 7')
    locale.value = 'unknown'
    await nextTick()
    expect(container.textContent).toBe('Custom close / Next / Slide 2 of 7')
  } finally {
    app.unmount()
  }
})

it.each([
  [undefined, 'en'],
  [{}, 'en'],
  [{ locale: null }, 'en'],
  [{ locale: 'nl' }, 'nl'],
])('reads the optional Nuxt i18n boundary %j', (composer, expected) => {
  expect(resolveNuxtPhotoLocale(composer)).toBe(expected)
})
