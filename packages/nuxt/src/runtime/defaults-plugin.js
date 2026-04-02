import { defineNuxtPlugin, useAppConfig } from "#app";
import { LightboxDefaultsKey } from "@nuxt-photo/vue";
export default defineNuxtPlugin({
  name: "nuxt-photo:defaults",
  setup(nuxtApp) {
    const config = useAppConfig();
    const lightbox = config.nuxtPhoto?.lightbox;
    if (lightbox?.minZoom != null) {
      nuxtApp.vueApp.provide(LightboxDefaultsKey, { minZoom: lightbox.minZoom });
    }
  }
});
