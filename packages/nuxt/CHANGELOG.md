# @lupinum/nuxt-photo

## 1.0.0

### Major Changes

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Remove the `defaultContainerWidth` prop of `PhotoAlbum` and the `.np-album__column` and `.np-album__skeleton` classes: the `rows`, `columns` and `masonry` layouts now render from CSS alone.
  
  The server sends an album that CSS places at every container width, so it no longer jumps after hydration, and with JavaScript turned off it looks the same. Layouts are planned at 320, 480, 640, 768, 1024, 1280, 1536, 1920 and 2560 pixels, or at your `breakpoints` and `responsive()` keys from the smallest one up. A function value for `spacing`, `padding`, `targetRowHeight` or `columns` is called at each of these widths instead of only at width 0, and the warning about it is gone. Column widths, spacing and padding stay the same. In `columns` and `masonry`, photos are one flat list in `photos` order, so keyboard focus in `masonry` follows `photos` order instead of going column by column. Photos you append keep their place in `rows` and `masonry`, and a `masonry` photo keeps its column while the container resizes within one column count.
  
  Migration: delete `default-container-width` from every `PhotoAlbum`; no layout needs a replacement. Move CSS that targets `.np-album__column` to `.np-album__item` or `.np-album__frame`, and delete rules for `.np-album__skeleton`.

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Replace the prerelease Embla integration with stable Embla 8.6 and its documented public methods. `PhotoCarousel` now accepts direct `loop`, `dragFree`, and `direction` props. Remove the `options` bag, `slidesToScroll`, and the private snap-model integration. Carousel lightboxes remain opt-in.

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Finalize the 1.0 lightbox contract. Rename `useLightboxProvider()` to `provideLightbox()` and `LightboxDefaults` to `PhotoDefaults` without compatibility aliases. Export `LightboxHandle` and expose it only from `PhotoAlbum` and `PhotoGroup`. Transition props now rebuild from immutable defaults when changed or cleared, and live reduced-motion changes flow through animation timing.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the lightbox caption to move with its photo. The built-in lightbox renders each photo's caption inside that photo's slide, under the photo, so the caption travels with it during a swipe and fades with it in `fade` and `crossfade`, with no animation of its own. Only the active photo's caption is exposed to assistive technology, and a tap on a caption no longer closes the lightbox. `LightboxSlide` takes the caption in a new `#caption` slot with `{ photo, index }` and a `captionClass` prop; `LightboxCaption` still renders one caption for the active photo. After a drag down, the backdrop now fades over the whole close instead of vanishing in a few frames.
  
  Migration: rules that placed or animated `.np-lightbox__caption` through `--np-frame-*` no longer apply, and the `np-caption-enter-*` and `np-caption-leave-*` classes are gone. Set the place with `--np-caption-gap` and `--np-caption-width`, and select the active photo's caption with `[data-np-active] .np-lightbox__caption`. The `caption` slot of `Lightbox` now renders once per mounted slide, and its `photo` is never `null`.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the Nuxt module to load the lightbox CSS with the viewer, not on every page.
  
  The `css` option keeps its meaning: `'structure'` loads the lightbox structure, `'all'` adds its theme, and `'none'` loads neither. A page that opens with a deep-linked photo still has the lightbox CSS in its server HTML. The new entries `@lupinum/nuxt-photo/lightbox.css` and `@lupinum/vue-photo/lightbox.css` hold the lightbox CSS for a lightbox built from primitives. With `components: { primitives: true }` the module still loads the lightbox CSS on every page. `@lupinum/vue-photo/styles.css` is unchanged.
  
  Migration: a Nuxt app that renders lightbox primitives imported from `@lupinum/nuxt-photo/primitives`, without `components: { primitives: true }`, imports `@lupinum/nuxt-photo/lightbox.css` once.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the lightbox root to a native `<dialog>` opened with `showModal()`.
  
  The browser now makes the page behind the lightbox inert and keeps focus inside it, so the library no longer sets `inert` and `aria-hidden` on page content or traps Tab itself. Escape and the Android back gesture still play the close animation, and a close the page cannot cancel ends in the closed state with scroll and history restored. The root keeps its accessible name, `ui` classes and passed attributes. A new `[data-np-lightbox-surface]` element inside the root holds the lightbox content and is the element the fullscreen tool enlarges, because browsers cannot show a `<dialog>` fullscreen. Safari users reach the lightbox controls with Option+Tab unless "Press Tab to highlight each item" is on, as on any Safari page.
  
  Migration: change CSS that selects direct children of `[data-np-lightbox-root]` to select children of `[data-np-lightbox-surface]`. Remove `role="dialog"` and `aria-modal` from a custom root, and with `css: 'none'` reset the browser's dialog styles (border, padding, size limits, background and `::backdrop`).

- [#83](https://github.com/lupinum-dev/nuxt-photo/pull/83) [`9803f68`](https://github.com/lupinum-dev/nuxt-photo/commit/9803f6825f85115ead0246930aaa1c9f50649dca) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Import everything from `@lupinum/vue-photo`. The `@lupinum/vue-photo/composables`, `/provide`, and `/types` subpaths are removed because each repeated part of the root entry. Nuxt apps keep using `@lupinum/nuxt-photo/app`.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change `PhotoItem.id` to optional: a photo without `id` uses its `src`. An explicit `id` still wins, and deep links, `v-model:active`, `openById()` and `data-np-photo-id` use the resolved ID. Two photos with the same resolved ID raise a `duplicate-id` issue that names both photos' `src`; give each of them an `id`.
  
  Remove the `missing-id` validation code. Add the `ResolvedPhotoItem` type: every photo handed back (slot props, `activePhoto`, `useLightbox().photos`, `validatePhotos()`) has `id: string`.
  
  Migration: replace a check for the `missing-id` code with nothing, since photos without `id` are now valid. Where two photos share a `src`, give each an `id`. Type values you read back from components as `ResolvedPhotoItem` when you need `id: string`.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the lightbox primitives to their own entry: `LightboxProvider`, `LightboxRoot`, `LightboxOverlay`, `LightboxAmbient`, `LightboxViewport`, `LightboxSlide`, `LightboxControls`, `LightboxCaption`, `PhotoTrigger` and their slot-prop types now come from `@lupinum/vue-photo/primitives`, or `@lupinum/nuxt-photo/primitives` in Nuxt. The primitives entry is advanced API and may change in a minor version. The root entry and `@lupinum/nuxt-photo/app` keep the stable API, including `PhotoImage`. `components: { primitives: true }` still registers the primitives by name.
  
  Migration: `import { LightboxProvider, PhotoTrigger } from '@lupinum/nuxt-photo/app'` becomes `import { LightboxProvider, PhotoTrigger } from '@lupinum/nuxt-photo/primitives'` (in plain Vue, `@lupinum/vue-photo` becomes `@lupinum/vue-photo/primitives`).

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change how the lightbox finds thumbnails: it now looks them up by photo ID.
  
  The lightbox reads a thumbnail's `data-np-photo-id` attribute when it opens or closes, so a thumbnail that re-renders while the lightbox is open is still found. The `PhotoGroup` slot controller replaces `hiddenThumbnailIndex` with `hiddenThumbnailId` and drops `setThumbnailRef`.
  
  Migration: in the `PhotoGroup` default slot, compare `controller.hiddenThumbnailId` with `photo.id` instead of `hiddenThumbnailIndex` with an index, and replace `:ref="controller.setThumbnailRef(index)"` with `:data-np-photo-id="photo.id"` on your thumbnail element.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change when the lightbox viewer loads: only when a visitor reaches for a photo.
  
  A page with `Photo`, `PhotoAlbum`, `PhotoCarousel` or `PhotoGroup` no longer ships the viewer in its first JavaScript. The viewer loads as one separate chunk when a pointer, touch or keyboard focus reaches a photo, when the browser is idle after a photo became visible, or when code opens a photo. The idle load does not happen when the visitor turned on data saving. A page that opens with a deep-linked photo still renders the open lightbox on the server. `useLightbox()` in a component slot works before the viewer has loaded: `open` and `openById` load it and resolve when the lightbox is open. The `columns` and `masonry` layout rules move from the shared stylesheet into the CSS that each such album generates.
  
  Migration: a component that you pass as `lightbox.component` now mounts when a photo first opens, not when the page mounts. Move code that must run at page mount out of that component.

### Minor Changes

- [#101](https://github.com/lupinum-dev/nuxt-photo/pull/101) [`019b562`](https://github.com/lupinum-dev/nuxt-photo/commit/019b562dc52d8b5aa7aaa933d5c021fb2685080b) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Make carousel autoplay accessible. While autoplay runs, a pause and play button comes first in the carousel's tab order, and the slide counter stops announcing every automatic change to screen readers. Autoplay no longer runs while the reader prefers reduced motion, and starts when that preference is removed. Two new labels, `pauseAutoplay` and `playAutoplay`, translate the button.

- [#104](https://github.com/lupinum-dev/nuxt-photo/pull/104) [`d2734fb`](https://github.com/lupinum-dev/nuxt-photo/commit/d2734fb6317d0bb74f4388dc462796236509587f) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add grid, bento, mosaic and accordion layouts to `PhotoAlbum`.
  
  CSS places every tile, so the server HTML is final at every container width and nothing moves after hydration. `grid` shows same-size tiles. `bento` mixes big and small tiles without gaps and takes a typed `featured` option. In `mosaic`, a few photos fill one frame and the last tile shows how many more there are. `accordion` slices open on hover or keyboard focus. All four crop photos to fill their tiles, and each tile downloads the size it is shown at. Bento and mosaic may move a photo a few places to crop less. The page, the Tab key and the lightbox follow the order on screen; `open(index)` still uses the position in `photos`.

- [#80](https://github.com/lupinum-dev/nuxt-photo/pull/80) [`018b12b`](https://github.com/lupinum-dev/nuxt-photo/commit/018b12bfb863f97a6108581872b7009319db3de5) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Make lightbox clicks do what people expect. A click or tap beside the photo now closes the lightbox. A mouse click on the photo zooms to its real pixels and back, while a touch tap still shows or hides the controls. Zoom and pan now measure the photo as it is drawn inside the lightbox mat, so a zoomed photo stops at its own edge. Hidden controls leave the Tab order and return on mouse movement or Tab. Closing focuses the thumbnail of the photo you were viewing.

- [#81](https://github.com/lupinum-dev/nuxt-photo/pull/81) [`41b2c64`](https://github.com/lupinum-dev/nuxt-photo/commit/41b2c64ae78121a4c2d7dabc99065e45a7b6021b) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Hang each lightbox photo in a mat, like a framed print, with its caption directly underneath instead of over the photo. Set the mat with `--np-frame-inset-top`, `--np-frame-inset-bottom`, and `--np-frame-inset-inline` on any lightbox root. The lightbox then publishes where the photo is drawn as `--np-frame-x`, `--np-frame-y`, `--np-frame-width`, and `--np-frame-height`, so custom and Tailwind lightboxes can anchor captions and arrows to the photo. The included theme adds icon buttons on dark glass that stay readable over any photo, arrows beside the photo, and a soft glow of the photo's colors behind it (`--np-ambient-opacity: 0` turns it off). The new `LightboxAmbient` primitive draws that glow and crossfades to the next photo only after its image has loaded, so custom lightboxes get the same smooth backdrop. Visible lightbox controls no longer force `pointer-events: auto`, so a full-screen controls layer stays click-through.

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add optional `placeholderSrc` previews to `PhotoItem` and `ImageSource`. Placeholders reset whenever the adapter-resolved URL changes and remain visible after load failures. `PhotoAlbum.sizes` now also accepts a native HTML sizes string for every layout.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change image delivery so every image downloads at the size it is shown, without waiting while scrolling.
  
  - `definePhotoProvider({ url })` connects any image service. In Nuxt, `nuxtPhoto.provider` or a component's `provider` prop names a Nuxt Image provider; without Nuxt Image, images use the photo's own `src`.
  - Nuxt Image's `image` config owns quality, format, `screens` and `densities`. The library builds `srcset` from them (on Vercel from `screens` only, so every width is accepted), never wider than the source file, from 128 px up.
  - The layout writes `sizes` from the real thumbnail width, already exact in the server HTML. `Photo` takes a `sizes` prop for photos that are not full width.
  - `priority` loads the first images first and preloads them during server rendering, at most six per page.
  - Images start loading 1.5 screens before they scroll into view, in every browser, and frames show a placeholder colour until the image arrives.
  - IPX serves WebP by default and a small blurred preview while each photo loads. GIFs keep their animation, SVGs are served unchanged, and URL-encoded local paths work.
  
  Local files in Nuxt:
  
  - `localImages: true` reads `width` and `height` of files in `public/` at build time and during `nuxt dev`, so photos from there need no dimensions. It is off by default because the table ships to the browser.
  - `usePhotoFolder(folder)` lists one folder of `public/` and sends only that folder in the page payload.
  - With the optional `sharp` peer, local photos get build-time blurred previews and an average colour.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add lightbox history, deep links and download, share and full-screen tools.
  
  Back closes the lightbox. Opening adds a browser history entry; set `lightbox: { history: false }` to turn it off.
  
  - `lightbox.deepLink` puts the open photo in the URL (`?photo=<id>` by default), so a link opens that photo.
  - `lightbox.tools` adds `download`, `share` and `fullscreen` buttons, and the `#tools` slot adds your own.
  - Only the open slide and one on each side are mounted. The previous and next images load in the background once the open image is shown, except when the visitor saves data.
  - Nuxt apps set one custom lightbox for the whole app with a file path: `nuxtPhoto.lightbox.component: '~/components/MyLightbox.vue'`.

- [#82](https://github.com/lupinum-dev/nuxt-photo/pull/82) [`6f2d8f3`](https://github.com/lupinum-dev/nuxt-photo/commit/6f2d8f316a9752528f3805f1ee80b74734ec81cc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Choose how the lightbox changes photos with the new `navigation` option: `slide` (default, the swipe strip), `fade` (the current photo fades out, then the next fades in), or `crossfade` (the next photo fades in over the current one). In the fade modes a swipe still works: the photo follows the finger and fades with distance, then either changes or settles back. Under reduced motion, `slide` now jumps to the next photo instead of scrolling.

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add typed Nuxt app configuration and complete module-level localization. Module options now preserve app-owned image, lightbox, and label values that they do not replace. Automatic native-image fallback remains quiet; warnings are limited to explicit adapter settings that cannot work.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change configuration to one place and labels to follow the page language.
  
  Nuxt apps set `nuxtPhoto` in `nuxt.config.ts`; plain Vue apps install settings with `app.use(createPhoto(config))`. An unknown or invalid option stops setup with a `TypeError` that names it.
  
  Labels follow the page language. Ten languages are bundled: `en de fr es it nl pt pt-PT ar he`, where `pt` is Brazilian Portuguese. Nuxt uses the active `@nuxtjs/i18n` locale and bundles only the languages the app needs; plain Vue reads the `lang` of the page. `labels: 'de'` picks a language, and an object overrides single labels.
  
  `validatePhotos()` checks photo data and returns the valid photos and every problem without throwing.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change every gallery component to the same API with `v-model:active` and `GalleryHandle`.
  
  `Photo`, `PhotoAlbum`, `PhotoGroup` and `PhotoCarousel` support `v-model:active` with a photo ID and expose the same `GalleryHandle` (`open`, `openById`, `close`, `isOpen`, `activeId`, `activePhoto`). The active photo follows its ID when the collection changes, so removing an earlier photo keeps the same photo open.
  
  - `lightbox` takes `true`, `false` or an options object: `{ component, transition, navigation, history, deepLink, tools }`.
  - One `ui` object sets classes on each part of a component.
  - `priority` loads the first images first.
  - `PhotoCarousel` shows the `controls` you list (`['arrows', 'thumbnails', 'counter']` by default, plus `'dots'`) and takes `loop` and `drag-free`.
  - Every component reads its direction from `dir` or CSS on the page.
  - `Photo` supports `validation="drop"`.
  - `PhotoAlbum` emits `end-reached` when its end comes within one screen, for "load more".
  
  The root entry exports the public contract only. Build custom lightboxes with `LightboxProvider` and `useLightbox`.

- [#116](https://github.com/lupinum-dev/nuxt-photo/pull/116) [`44642f6`](https://github.com/lupinum-dev/nuxt-photo/commit/44642f61f67a9bd45b4e64e325d27623257789a6) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add the `agent-docs` export: the documentation for the installed version, for coding agents.
  
  Follow **Agent setup** in the package README to point your project's `AGENTS.md` at it.

### Patch Changes

- [#99](https://github.com/lupinum-dev/nuxt-photo/pull/99) [`e824a6e`](https://github.com/lupinum-dev/nuxt-photo/commit/e824a6e762c15421dd881220d94c47bd7cd1d646) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Blur the lightbox glow for thumbnails from another origin, such as a CDN. The glow now requests those thumbnails with CORS, so the canvas can read and blur them. When the image server sends no CORS headers, it loads the thumbnail again without CORS and shows the softened glow as before.

- [#51](https://github.com/lupinum-dev/nuxt-photo/pull/51) [`1c049e8`](https://github.com/lupinum-dev/nuxt-photo/commit/1c049e8d3b611bf255de36c00b0df06586f46e15) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify beta installation, migration, and customization guidance for both published packages.

- [#53](https://github.com/lupinum-dev/nuxt-photo/pull/53) [`3ef5f1a`](https://github.com/lupinum-dev/nuxt-photo/commit/3ef5f1aabc00cc4c5f63cf8c867d44f143a8362c) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Reorganize and complete the public guides, concepts, and API reference for both packages.

- [#92](https://github.com/lupinum-dev/nuxt-photo/pull/92) [`bcc2d9f`](https://github.com/lupinum-dev/nuxt-photo/commit/bcc2d9f2172bf22d8bb25ee287538cac422482ff) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Explain every public component prop and `PhotoItem` field in the types, so editor hovers and coding agents see the meaning, the default, and whether a value can change after mount. Error messages for invalid photos, a missing lightbox provider, and a photo missing from its `PhotoGroup` now say how to fix the problem and link to the docs.

- [#49](https://github.com/lupinum-dev/nuxt-photo/pull/49) [`ae1b5f3`](https://github.com/lupinum-dev/nuxt-photo/commit/ae1b5f3573b7e4301e97bd5dfc0d0668413d709e) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Keep shared lightbox navigation aligned when a collection opens at a non-zero photo, and allow carousel autoplay to be enabled without specifying a custom delay. Repair the documentation image demos so their rendered output matches the examples.

- [#57](https://github.com/lupinum-dev/nuxt-photo/pull/57) [`d952f26`](https://github.com/lupinum-dev/nuxt-photo/commit/d952f268bf85a154556d9dd4c3729d7267f77239) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Turn the public examples into interactive showcases that demonstrate both packages in context.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Fix the lightbox swipe and close drag on touch screens, which stopped after the first move in Chromium.
  
  In `slide` mode the lightbox now moves photos with its own pointer code instead of Embla, so the viewer loads less JavaScript. The track follows the pointer one to one, a release goes to the next or previous photo by position and speed, a new drag catches a photo that is still settling, and the collection loops. Arrow keys, buttons and the wheel use the same slide. `PhotoCarousel` still uses Embla.

- [#87](https://github.com/lupinum-dev/nuxt-photo/pull/87) [`a3b7ee1`](https://github.com/lupinum-dev/nuxt-photo/commit/a3b7ee16fe4bf4e07c87bd0c8220a12f3439de49) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Show the docs as working software. The site opens with a live album and lightbox, a new Examples page offers complete components to copy, and the lightbox guides end with their live result rendered from the same file as the code shown. Decorative playgrounds are removed; the help pages cover click routing, the fade modes, and the backdrop glow.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Fix the dev server answering 500 with `Unknown file extension ".vue"` for a page that renders a photo component, in an app that installed the module from the registry. `nuxt build` was not affected.

- [#52](https://github.com/lupinum-dev/nuxt-photo/pull/52) [`d537187`](https://github.com/lupinum-dev/nuxt-photo/commit/d5371871d3d1ed545ae4c388af2538ef772cb989) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Simplify the installation, first-gallery, and architecture guidance for new users.

- [#79](https://github.com/lupinum-dev/nuxt-photo/pull/79) [`dedfdae`](https://github.com/lupinum-dev/nuxt-photo/commit/dedfdae8e5d33976298bddba462d7d193119632b) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Keep photos in shape while the lightbox opens and closes. The flight between a cropped thumbnail and the full photo now uses one uniform scale and a clip, so the photo no longer stretches. The open flight starts only after the gallery and slides have painted, and a close from a key or button starts moving at once and eases from rest. Closing while the lightbox is still opening now reverses from the current pose and crop, instead of snapping back to the thumbnail and flashing the full image. The backdrop and controls no longer show at full strength for a frame before the open animation starts.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Fix album layout shifts, slow large albums and several lightbox and carousel issues.
  
  - Columns, masonry and rows render the same geometry on the server as in the browser, so nothing shifts while the page streams in or hydrates.
  - Columns albums with thousands of photos lay out in milliseconds instead of freezing the page; large rows albums are faster too.
  - Fast clicks on carousel arrows are no longer undone by a drag.
  - The lightbox keeps focus inside when the browser skips buttons in its tab order, mirrors its arrows in right-to-left pages, and no longer triggers ResizeObserver loop errors.
  - Photo validation errors keep their message and troubleshooting link in every component.
  - Carousel autoplay no longer leaks event listeners when its options change.

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Honor Nuxt app-config-only photo defaults, preserve nested image settings, and localize carousel triggers. Harden collection registration, responsive placeholder resets, strict photo revalidation, metadata-safe layouts, and cancellation of overlapping lightbox animations.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the label catalogs so that labels only the lightbox viewer shows load with the viewer.
  
  A page with an album or a carousel no longer ships the viewer's close, navigation, zoom, tool and error labels before a visitor reaches for a photo. `usePhotoLabels()` still returns every label, and label overrides and locales apply as before.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add `@lupinum/vue-photo/styles/*` to import a single stylesheet, for example `@lupinum/vue-photo/styles/lightbox-structure.css`. The Nuxt module now uses the Vue package only through its exports map, so a strict package manager no longer depends on the internal file layout of `@lupinum/vue-photo`. The new entries `@lupinum/vue-photo/internal`, `/locales/photo`, `/locales/viewer`, `/viewer`, `/viewer-structure` and `/viewer-themed` are for `@lupinum/nuxt-photo` of the same version only: semantic versioning does not cover them.
- Updated dependencies [[`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`e824a6e`](https://github.com/lupinum-dev/nuxt-photo/commit/e824a6e762c15421dd881220d94c47bd7cd1d646), [`019b562`](https://github.com/lupinum-dev/nuxt-photo/commit/019b562dc52d8b5aa7aaa933d5c021fb2685080b), [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`1c049e8`](https://github.com/lupinum-dev/nuxt-photo/commit/1c049e8d3b611bf255de36c00b0df06586f46e15), [`3ef5f1a`](https://github.com/lupinum-dev/nuxt-photo/commit/3ef5f1aabc00cc4c5f63cf8c867d44f143a8362c), [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898), [`d2734fb`](https://github.com/lupinum-dev/nuxt-photo/commit/d2734fb6317d0bb74f4388dc462796236509587f), [`018b12b`](https://github.com/lupinum-dev/nuxt-photo/commit/018b12bfb863f97a6108581872b7009319db3de5), [`bcc2d9f`](https://github.com/lupinum-dev/nuxt-photo/commit/bcc2d9f2172bf22d8bb25ee287538cac422482ff), [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898), [`ae1b5f3`](https://github.com/lupinum-dev/nuxt-photo/commit/ae1b5f3573b7e4301e97bd5dfc0d0668413d709e), [`41b2c64`](https://github.com/lupinum-dev/nuxt-photo/commit/41b2c64ae78121a4c2d7dabc99065e45a7b6021b), [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898), [`d952f26`](https://github.com/lupinum-dev/nuxt-photo/commit/d952f268bf85a154556d9dd4c3729d7267f77239), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`6f2d8f3`](https://github.com/lupinum-dev/nuxt-photo/commit/6f2d8f316a9752528f3805f1ee80b74734ec81cc), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`a3b7ee1`](https://github.com/lupinum-dev/nuxt-photo/commit/a3b7ee16fe4bf4e07c87bd0c8220a12f3439de49), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`9803f68`](https://github.com/lupinum-dev/nuxt-photo/commit/9803f6825f85115ead0246930aaa1c9f50649dca), [`44642f6`](https://github.com/lupinum-dev/nuxt-photo/commit/44642f61f67a9bd45b4e64e325d27623257789a6), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`29ede46`](https://github.com/lupinum-dev/nuxt-photo/commit/29ede4619a60090a51c3cf163244eb2a84c1180c), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`d537187`](https://github.com/lupinum-dev/nuxt-photo/commit/d5371871d3d1ed545ae4c388af2538ef772cb989), [`dedfdae`](https://github.com/lupinum-dev/nuxt-photo/commit/dedfdae8e5d33976298bddba462d7d193119632b), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92)]:
  - @lupinum/vue-photo@1.0.0

## 1.0.0-beta.9

### Major Changes

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Remove the `defaultContainerWidth` prop of `PhotoAlbum` and the `.np-album__column` and `.np-album__skeleton` classes: the `rows`, `columns` and `masonry` layouts now render from CSS alone.
  
  The server sends an album that CSS places at every container width, so it no longer jumps after hydration, and with JavaScript turned off it looks the same. Layouts are planned at 320, 480, 640, 768, 1024, 1280, 1536, 1920 and 2560 pixels, or at your `breakpoints` and `responsive()` keys from the smallest one up. A function value for `spacing`, `padding`, `targetRowHeight` or `columns` is called at each of these widths instead of only at width 0, and the warning about it is gone. Column widths, spacing and padding stay the same. In `columns` and `masonry`, photos are one flat list in `photos` order, so keyboard focus in `masonry` follows `photos` order instead of going column by column. Photos you append keep their place in `rows` and `masonry`, and a `masonry` photo keeps its column while the container resizes within one column count.
  
  Migration: delete `default-container-width` from every `PhotoAlbum`; no layout needs a replacement. Move CSS that targets `.np-album__column` to `.np-album__item` or `.np-album__frame`, and delete rules for `.np-album__skeleton`.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the lightbox caption to move with its photo. The built-in lightbox renders each photo's caption inside that photo's slide, under the photo, so the caption travels with it during a swipe and fades with it in `fade` and `crossfade`, with no animation of its own. Only the active photo's caption is exposed to assistive technology, and a tap on a caption no longer closes the lightbox. `LightboxSlide` takes the caption in a new `#caption` slot with `{ photo, index }` and a `captionClass` prop; `LightboxCaption` still renders one caption for the active photo. After a drag down, the backdrop now fades over the whole close instead of vanishing in a few frames.
  
  Migration: rules that placed or animated `.np-lightbox__caption` through `--np-frame-*` no longer apply, and the `np-caption-enter-*` and `np-caption-leave-*` classes are gone. Set the place with `--np-caption-gap` and `--np-caption-width`, and select the active photo's caption with `[data-np-active] .np-lightbox__caption`. The `caption` slot of `Lightbox` now renders once per mounted slide, and its `photo` is never `null`.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the Nuxt module to load the lightbox CSS with the viewer, not on every page.
  
  The `css` option keeps its meaning: `'structure'` loads the lightbox structure, `'all'` adds its theme, and `'none'` loads neither. A page that opens with a deep-linked photo still has the lightbox CSS in its server HTML. The new entries `@lupinum/nuxt-photo/lightbox.css` and `@lupinum/vue-photo/lightbox.css` hold the lightbox CSS for a lightbox built from primitives. With `components: { primitives: true }` the module still loads the lightbox CSS on every page. `@lupinum/vue-photo/styles.css` is unchanged.
  
  Migration: a Nuxt app that renders lightbox primitives imported from `@lupinum/nuxt-photo/primitives`, without `components: { primitives: true }`, imports `@lupinum/nuxt-photo/lightbox.css` once.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the lightbox root to a native `<dialog>` opened with `showModal()`.
  
  The browser now makes the page behind the lightbox inert and keeps focus inside it, so the library no longer sets `inert` and `aria-hidden` on page content or traps Tab itself. Escape and the Android back gesture still play the close animation, and a close the page cannot cancel ends in the closed state with scroll and history restored. The root keeps its accessible name, `ui` classes and passed attributes. A new `[data-np-lightbox-surface]` element inside the root holds the lightbox content and is the element the fullscreen tool enlarges, because browsers cannot show a `<dialog>` fullscreen. Safari users reach the lightbox controls with Option+Tab unless "Press Tab to highlight each item" is on, as on any Safari page.
  
  Migration: change CSS that selects direct children of `[data-np-lightbox-root]` to select children of `[data-np-lightbox-surface]`. Remove `role="dialog"` and `aria-modal` from a custom root, and with `css: 'none'` reset the browser's dialog styles (border, padding, size limits, background and `::backdrop`).

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change `PhotoItem.id` to optional: a photo without `id` uses its `src`. An explicit `id` still wins, and deep links, `v-model:active`, `openById()` and `data-np-photo-id` use the resolved ID. Two photos with the same resolved ID raise a `duplicate-id` issue that names both photos' `src`; give each of them an `id`.
  
  Remove the `missing-id` validation code. Add the `ResolvedPhotoItem` type: every photo handed back (slot props, `activePhoto`, `useLightbox().photos`, `validatePhotos()`) has `id: string`.
  
  Migration: replace a check for the `missing-id` code with nothing, since photos without `id` are now valid. Where two photos share a `src`, give each an `id`. Type values you read back from components as `ResolvedPhotoItem` when you need `id: string`.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the lightbox primitives to their own entry: `LightboxProvider`, `LightboxRoot`, `LightboxOverlay`, `LightboxAmbient`, `LightboxViewport`, `LightboxSlide`, `LightboxControls`, `LightboxCaption`, `PhotoTrigger` and their slot-prop types now come from `@lupinum/vue-photo/primitives`, or `@lupinum/nuxt-photo/primitives` in Nuxt. The primitives entry is advanced API and may change in a minor version. The root entry and `@lupinum/nuxt-photo/app` keep the stable API, including `PhotoImage`. `components: { primitives: true }` still registers the primitives by name.
  
  Migration: `import { LightboxProvider, PhotoTrigger } from '@lupinum/nuxt-photo/app'` becomes `import { LightboxProvider, PhotoTrigger } from '@lupinum/nuxt-photo/primitives'` (in plain Vue, `@lupinum/vue-photo` becomes `@lupinum/vue-photo/primitives`).

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change how the lightbox finds thumbnails: it now looks them up by photo ID.
  
  The lightbox reads a thumbnail's `data-np-photo-id` attribute when it opens or closes, so a thumbnail that re-renders while the lightbox is open is still found. The `PhotoGroup` slot controller replaces `hiddenThumbnailIndex` with `hiddenThumbnailId` and drops `setThumbnailRef`.
  
  Migration: in the `PhotoGroup` default slot, compare `controller.hiddenThumbnailId` with `photo.id` instead of `hiddenThumbnailIndex` with an index, and replace `:ref="controller.setThumbnailRef(index)"` with `:data-np-photo-id="photo.id"` on your thumbnail element.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change when the lightbox viewer loads: only when a visitor reaches for a photo.
  
  A page with `Photo`, `PhotoAlbum`, `PhotoCarousel` or `PhotoGroup` no longer ships the viewer in its first JavaScript. The viewer loads as one separate chunk when a pointer, touch or keyboard focus reaches a photo, when the browser is idle after a photo became visible, or when code opens a photo. The idle load does not happen when the visitor turned on data saving. A page that opens with a deep-linked photo still renders the open lightbox on the server. `useLightbox()` in a component slot works before the viewer has loaded: `open` and `openById` load it and resolve when the lightbox is open. The `columns` and `masonry` layout rules move from the shared stylesheet into the CSS that each such album generates.
  
  Migration: a component that you pass as `lightbox.component` now mounts when a photo first opens, not when the page mounts. Move code that must run at page mount out of that component.

### Patch Changes

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Fix the lightbox swipe and close drag on touch screens, which stopped after the first move in Chromium.
  
  In `slide` mode the lightbox now moves photos with its own pointer code instead of Embla, so the viewer loads less JavaScript. The track follows the pointer one to one, a release goes to the next or previous photo by position and speed, a new drag catches a photo that is still settling, and the collection loops. Arrow keys, buttons and the wheel use the same slide. `PhotoCarousel` still uses Embla.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Fix the dev server answering 500 with `Unknown file extension ".vue"` for a page that renders a photo component, in an app that installed the module from the registry. `nuxt build` was not affected.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change the label catalogs so that labels only the lightbox viewer shows load with the viewer.
  
  A page with an album or a carousel no longer ships the viewer's close, navigation, zoom, tool and error labels before a visitor reaches for a photo. `usePhotoLabels()` still returns every label, and label overrides and locales apply as before.

- [#125](https://github.com/lupinum-dev/nuxt-photo/pull/125) [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add `@lupinum/vue-photo/styles/*` to import a single stylesheet, for example `@lupinum/vue-photo/styles/lightbox-structure.css`. The Nuxt module now uses the Vue package only through its exports map, so a strict package manager no longer depends on the internal file layout of `@lupinum/vue-photo`. The new entries `@lupinum/vue-photo/internal`, `/locales/photo`, `/locales/viewer`, `/viewer`, `/viewer-structure` and `/viewer-themed` are for `@lupinum/nuxt-photo` of the same version only: semantic versioning does not cover them.
- Updated dependencies [[`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92), [`37811ec`](https://github.com/lupinum-dev/nuxt-photo/commit/37811ec8dc98e15842dc79363f46143f655ebb92)]:
  - @lupinum/vue-photo@1.0.0-beta.9

## 1.0.0-beta.8

### Minor Changes

- [#116](https://github.com/lupinum-dev/nuxt-photo/pull/116) [`44642f6`](https://github.com/lupinum-dev/nuxt-photo/commit/44642f61f67a9bd45b4e64e325d27623257789a6) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add the `agent-docs` export: the documentation for the installed version, for coding agents.
  
  Follow **Agent setup** in the package README to point your project's `AGENTS.md` at it.

### Patch Changes

- Updated dependencies [[`44642f6`](https://github.com/lupinum-dev/nuxt-photo/commit/44642f61f67a9bd45b4e64e325d27623257789a6)]:
  - @lupinum/vue-photo@1.0.0-beta.8

## 1.0.0-beta.7

### Minor Changes

- [#104](https://github.com/lupinum-dev/nuxt-photo/pull/104) [`d2734fb`](https://github.com/lupinum-dev/nuxt-photo/commit/d2734fb6317d0bb74f4388dc462796236509587f) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add grid, bento, mosaic and accordion layouts to `PhotoAlbum`.
  
  CSS places every tile, so the server HTML is final at every container width and nothing moves after hydration. `grid` shows same-size tiles. `bento` mixes big and small tiles without gaps and takes a typed `featured` option. In `mosaic`, a few photos fill one frame and the last tile shows how many more there are. `accordion` slices open on hover or keyboard focus. All four crop photos to fill their tiles, and each tile downloads the size it is shown at. Bento and mosaic may move a photo a few places to crop less. The page, the Tab key and the lightbox follow the order on screen; `open(index)` still uses the position in `photos`.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change image delivery so every image downloads at the size it is shown, without waiting while scrolling.
  
  - `definePhotoProvider({ url })` connects any image service. In Nuxt, `nuxtPhoto.provider` or a component's `provider` prop names a Nuxt Image provider; without Nuxt Image, images use the photo's own `src`.
  - Nuxt Image's `image` config owns quality, format, `screens` and `densities`. The library builds `srcset` from them (on Vercel from `screens` only, so every width is accepted), never wider than the source file, from 128 px up.
  - The layout writes `sizes` from the real thumbnail width, already exact in the server HTML. `Photo` takes a `sizes` prop for photos that are not full width.
  - `priority` loads the first images first and preloads them during server rendering, at most six per page.
  - Images start loading 1.5 screens before they scroll into view, in every browser, and frames show a placeholder colour until the image arrives.
  - IPX serves WebP by default and a small blurred preview while each photo loads. GIFs keep their animation, SVGs are served unchanged, and URL-encoded local paths work.
  
  Local files in Nuxt:
  
  - `localImages: true` reads `width` and `height` of files in `public/` at build time and during `nuxt dev`, so photos from there need no dimensions. It is off by default because the table ships to the browser.
  - `usePhotoFolder(folder)` lists one folder of `public/` and sends only that folder in the page payload.
  - With the optional `sharp` peer, local photos get build-time blurred previews and an average colour.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add lightbox history, deep links and download, share and full-screen tools.
  
  Back closes the lightbox. Opening adds a browser history entry; set `lightbox: { history: false }` to turn it off.
  
  - `lightbox.deepLink` puts the open photo in the URL (`?photo=<id>` by default), so a link opens that photo.
  - `lightbox.tools` adds `download`, `share` and `fullscreen` buttons, and the `#tools` slot adds your own.
  - Only the open slide and one on each side are mounted. The previous and next images load in the background once the open image is shown, except when the visitor saves data.
  - Nuxt apps set one custom lightbox for the whole app with a file path: `nuxtPhoto.lightbox.component: '~/components/MyLightbox.vue'`.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change configuration to one place and labels to follow the page language.
  
  Nuxt apps set `nuxtPhoto` in `nuxt.config.ts`; plain Vue apps install settings with `app.use(createPhoto(config))`. An unknown or invalid option stops setup with a `TypeError` that names it.
  
  Labels follow the page language. Ten languages are bundled: `en de fr es it nl pt pt-PT ar he`, where `pt` is Brazilian Portuguese. Nuxt uses the active `@nuxtjs/i18n` locale and bundles only the languages the app needs; plain Vue reads the `lang` of the page. `labels: 'de'` picks a language, and an object overrides single labels.
  
  `validatePhotos()` checks photo data and returns the valid photos and every problem without throwing.

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Change every gallery component to the same API with `v-model:active` and `GalleryHandle`.
  
  `Photo`, `PhotoAlbum`, `PhotoGroup` and `PhotoCarousel` support `v-model:active` with a photo ID and expose the same `GalleryHandle` (`open`, `openById`, `close`, `isOpen`, `activeId`, `activePhoto`). The active photo follows its ID when the collection changes, so removing an earlier photo keeps the same photo open.
  
  - `lightbox` takes `true`, `false` or an options object: `{ component, transition, navigation, history, deepLink, tools }`.
  - One `ui` object sets classes on each part of a component.
  - `priority` loads the first images first.
  - `PhotoCarousel` shows the `controls` you list (`['arrows', 'thumbnails', 'counter']` by default, plus `'dots'`) and takes `loop` and `drag-free`.
  - Every component reads its direction from `dir` or CSS on the page.
  - `Photo` supports `validation="drop"`.
  - `PhotoAlbum` emits `end-reached` when its end comes within one screen, for "load more".
  
  The root entry exports the public contract only. Build custom lightboxes with `LightboxProvider` and `useLightbox`.

### Patch Changes

- [#110](https://github.com/lupinum-dev/nuxt-photo/pull/110) [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Fix album layout shifts, slow large albums and several lightbox and carousel issues.
  
  - Columns, masonry and rows render the same geometry on the server as in the browser, so nothing shifts while the page streams in or hydrates.
  - Columns albums with thousands of photos lay out in milliseconds instead of freezing the page; large rows albums are faster too.
  - Fast clicks on carousel arrows are no longer undone by a drag.
  - The lightbox keeps focus inside when the browser skips buttons in its tab order, mirrors its arrows in right-to-left pages, and no longer triggers ResizeObserver loop errors.
  - Photo validation errors keep their message and troubleshooting link in every component.
  - Carousel autoplay no longer leaks event listeners when its options change.
- Updated dependencies [[`d2734fb`](https://github.com/lupinum-dev/nuxt-photo/commit/d2734fb6317d0bb74f4388dc462796236509587f), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7), [`230e2fc`](https://github.com/lupinum-dev/nuxt-photo/commit/230e2fc37127ce02178bb2507b4808e9c6ec5bf7)]:
  - @lupinum/vue-photo@1.0.0-beta.7

## 1.0.0-beta.6

### Major Changes

- [#83](https://github.com/lupinum-dev/nuxt-photo/pull/83) [`9803f68`](https://github.com/lupinum-dev/nuxt-photo/commit/9803f6825f85115ead0246930aaa1c9f50649dca) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Import everything from `@lupinum/vue-photo`. The `@lupinum/vue-photo/composables`, `/provide`, and `/types` subpaths are removed because each repeated part of the root entry. Nuxt apps keep using `@lupinum/nuxt-photo/app`.

### Minor Changes

- [#101](https://github.com/lupinum-dev/nuxt-photo/pull/101) [`019b562`](https://github.com/lupinum-dev/nuxt-photo/commit/019b562dc52d8b5aa7aaa933d5c021fb2685080b) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Make carousel autoplay accessible. While autoplay runs, a pause and play button comes first in the carousel's tab order, and the slide counter stops announcing every automatic change to screen readers. Autoplay no longer runs while the reader prefers reduced motion, and starts when that preference is removed. Two new labels, `pauseAutoplay` and `playAutoplay`, translate the button.

- [#80](https://github.com/lupinum-dev/nuxt-photo/pull/80) [`018b12b`](https://github.com/lupinum-dev/nuxt-photo/commit/018b12bfb863f97a6108581872b7009319db3de5) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Make lightbox clicks do what people expect. A click or tap beside the photo now closes the lightbox. A mouse click on the photo zooms to its real pixels and back, while a touch tap still shows or hides the controls. Zoom and pan now measure the photo as it is drawn inside the lightbox mat, so a zoomed photo stops at its own edge. Hidden controls leave the Tab order and return on mouse movement or Tab. Closing focuses the thumbnail of the photo you were viewing.

- [#81](https://github.com/lupinum-dev/nuxt-photo/pull/81) [`41b2c64`](https://github.com/lupinum-dev/nuxt-photo/commit/41b2c64ae78121a4c2d7dabc99065e45a7b6021b) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Hang each lightbox photo in a mat, like a framed print, with its caption directly underneath instead of over the photo. Set the mat with `--np-frame-inset-top`, `--np-frame-inset-bottom`, and `--np-frame-inset-inline` on any lightbox root. The lightbox then publishes where the photo is drawn as `--np-frame-x`, `--np-frame-y`, `--np-frame-width`, and `--np-frame-height`, so custom and Tailwind lightboxes can anchor captions and arrows to the photo. The included theme adds icon buttons on dark glass that stay readable over any photo, arrows beside the photo, and a soft glow of the photo's colors behind it (`--np-ambient-opacity: 0` turns it off). The new `LightboxAmbient` primitive draws that glow and crossfades to the next photo only after its image has loaded, so custom lightboxes get the same smooth backdrop. Visible lightbox controls no longer force `pointer-events: auto`, so a full-screen controls layer stays click-through.

- [#82](https://github.com/lupinum-dev/nuxt-photo/pull/82) [`6f2d8f3`](https://github.com/lupinum-dev/nuxt-photo/commit/6f2d8f316a9752528f3805f1ee80b74734ec81cc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Choose how the lightbox changes photos with the new `navigation` option: `slide` (default, the swipe strip), `fade` (the current photo fades out, then the next fades in), or `crossfade` (the next photo fades in over the current one). In the fade modes a swipe still works: the photo follows the finger and fades with distance, then either changes or settles back. Under reduced motion, `slide` now jumps to the next photo instead of scrolling.

### Patch Changes

- [#99](https://github.com/lupinum-dev/nuxt-photo/pull/99) [`e824a6e`](https://github.com/lupinum-dev/nuxt-photo/commit/e824a6e762c15421dd881220d94c47bd7cd1d646) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Blur the lightbox glow for thumbnails from another origin, such as a CDN. The glow now requests those thumbnails with CORS, so the canvas can read and blur them. When the image server sends no CORS headers, it loads the thumbnail again without CORS and shows the softened glow as before.

- [#92](https://github.com/lupinum-dev/nuxt-photo/pull/92) [`bcc2d9f`](https://github.com/lupinum-dev/nuxt-photo/commit/bcc2d9f2172bf22d8bb25ee287538cac422482ff) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Explain every public component prop and `PhotoItem` field in the types, so editor hovers and coding agents see the meaning, the default, and whether a value can change after mount. Error messages for invalid photos, a missing lightbox provider, and a photo missing from its `PhotoGroup` now say how to fix the problem and link to the docs.

- [#87](https://github.com/lupinum-dev/nuxt-photo/pull/87) [`a3b7ee1`](https://github.com/lupinum-dev/nuxt-photo/commit/a3b7ee16fe4bf4e07c87bd0c8220a12f3439de49) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Show the docs as working software. The site opens with a live album and lightbox, a new Examples page offers complete components to copy, and the lightbox guides end with their live result rendered from the same file as the code shown. Decorative playgrounds are removed; the help pages cover click routing, the fade modes, and the backdrop glow.

- [#79](https://github.com/lupinum-dev/nuxt-photo/pull/79) [`dedfdae`](https://github.com/lupinum-dev/nuxt-photo/commit/dedfdae8e5d33976298bddba462d7d193119632b) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Keep photos in shape while the lightbox opens and closes. The flight between a cropped thumbnail and the full photo now uses one uniform scale and a clip, so the photo no longer stretches. The open flight starts only after the gallery and slides have painted, and a close from a key or button starts moving at once and eases from rest. Closing while the lightbox is still opening now reverses from the current pose and crop, instead of snapping back to the thumbnail and flashing the full image. The backdrop and controls no longer show at full strength for a frame before the open animation starts.

- Updated dependencies [[`e824a6e`](https://github.com/lupinum-dev/nuxt-photo/commit/e824a6e762c15421dd881220d94c47bd7cd1d646), [`019b562`](https://github.com/lupinum-dev/nuxt-photo/commit/019b562dc52d8b5aa7aaa933d5c021fb2685080b), [`018b12b`](https://github.com/lupinum-dev/nuxt-photo/commit/018b12bfb863f97a6108581872b7009319db3de5), [`bcc2d9f`](https://github.com/lupinum-dev/nuxt-photo/commit/bcc2d9f2172bf22d8bb25ee287538cac422482ff), [`41b2c64`](https://github.com/lupinum-dev/nuxt-photo/commit/41b2c64ae78121a4c2d7dabc99065e45a7b6021b), [`6f2d8f3`](https://github.com/lupinum-dev/nuxt-photo/commit/6f2d8f316a9752528f3805f1ee80b74734ec81cc), [`a3b7ee1`](https://github.com/lupinum-dev/nuxt-photo/commit/a3b7ee16fe4bf4e07c87bd0c8220a12f3439de49), [`9803f68`](https://github.com/lupinum-dev/nuxt-photo/commit/9803f6825f85115ead0246930aaa1c9f50649dca), [`dedfdae`](https://github.com/lupinum-dev/nuxt-photo/commit/dedfdae8e5d33976298bddba462d7d193119632b)]:
  - @lupinum/vue-photo@1.0.0-beta.6

## 1.0.0-beta.5

### Patch Changes

- Updated dependencies [[`29ede46`](https://github.com/lupinum-dev/nuxt-photo/commit/29ede4619a60090a51c3cf163244eb2a84c1180c)]:
  - @lupinum/vue-photo@1.0.0-beta.5

## 1.0.0-beta.4

### Patch Changes

- [#51](https://github.com/lupinum-dev/nuxt-photo/pull/51) [`1c049e8`](https://github.com/lupinum-dev/nuxt-photo/commit/1c049e8d3b611bf255de36c00b0df06586f46e15) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify beta installation, migration, and customization guidance for both published packages.

- [#53](https://github.com/lupinum-dev/nuxt-photo/pull/53) [`3ef5f1a`](https://github.com/lupinum-dev/nuxt-photo/commit/3ef5f1aabc00cc4c5f63cf8c867d44f143a8362c) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Reorganize and complete the public guides, concepts, and API reference for both packages.

- [#57](https://github.com/lupinum-dev/nuxt-photo/pull/57) [`d952f26`](https://github.com/lupinum-dev/nuxt-photo/commit/d952f268bf85a154556d9dd4c3729d7267f77239) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Turn the public examples into interactive showcases that demonstrate both packages in context.

- [#52](https://github.com/lupinum-dev/nuxt-photo/pull/52) [`d537187`](https://github.com/lupinum-dev/nuxt-photo/commit/d5371871d3d1ed545ae4c388af2538ef772cb989) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Simplify the installation, first-gallery, and architecture guidance for new users.

- Updated dependencies [[`1c049e8`](https://github.com/lupinum-dev/nuxt-photo/commit/1c049e8d3b611bf255de36c00b0df06586f46e15), [`3ef5f1a`](https://github.com/lupinum-dev/nuxt-photo/commit/3ef5f1aabc00cc4c5f63cf8c867d44f143a8362c), [`d952f26`](https://github.com/lupinum-dev/nuxt-photo/commit/d952f268bf85a154556d9dd4c3729d7267f77239), [`d537187`](https://github.com/lupinum-dev/nuxt-photo/commit/d5371871d3d1ed545ae4c388af2538ef772cb989)]:
  - @lupinum/vue-photo@1.0.0-beta.4

## 1.0.0-beta.3

### Patch Changes

- [#49](https://github.com/lupinum-dev/nuxt-photo/pull/49) [`ae1b5f3`](https://github.com/lupinum-dev/nuxt-photo/commit/ae1b5f3573b7e4301e97bd5dfc0d0668413d709e) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Keep shared lightbox navigation aligned when a collection opens at a non-zero photo, and allow carousel autoplay to be enabled without specifying a custom delay. Repair the documentation image demos so their rendered output matches the examples.

- Updated dependencies [[`ae1b5f3`](https://github.com/lupinum-dev/nuxt-photo/commit/ae1b5f3573b7e4301e97bd5dfc0d0668413d709e)]:
  - @lupinum/vue-photo@1.0.0-beta.3

## 1.0.0-beta.2

### Patch Changes

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Honor Nuxt app-config-only photo defaults, preserve nested image settings, and localize carousel triggers. Harden collection registration, responsive placeholder resets, strict photo revalidation, metadata-safe layouts, and cancellation of overlapping lightbox animations.

- Updated dependencies [[`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898)]:
  - @lupinum/vue-photo@1.0.0-beta.2

## 1.0.0-beta.1

### Major Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Replace the prerelease Embla integration with stable Embla 8.6 and its documented public methods. `PhotoCarousel` now accepts direct `loop`, `dragFree`, and `direction` props. Remove the `options` bag, `slidesToScroll`, and the private snap-model integration. Carousel lightboxes remain opt-in.

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Finalize the 1.0 lightbox contract. Rename `useLightboxProvider()` to `provideLightbox()` and `LightboxDefaults` to `PhotoDefaults` without compatibility aliases. Export `LightboxHandle` and expose it only from `PhotoAlbum` and `PhotoGroup`. Transition props now rebuild from immutable defaults when changed or cleared, and live reduced-motion changes flow through animation timing.

### Minor Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add optional `placeholderSrc` previews to `PhotoItem` and `ImageSource`. Placeholders reset whenever the adapter-resolved URL changes and remain visible after load failures. `PhotoAlbum.sizes` now also accepts a native HTML sizes string for every layout.

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add typed Nuxt app configuration and complete module-level localization. Module options now preserve app-owned image, lightbox, and label values that they do not replace. Automatic native-image fallback remains quiet; warnings are limited to explicit adapter settings that cannot work.

### Patch Changes

- Updated dependencies [[`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc)]:
  - @lupinum/vue-photo@1.0.0-beta.1

## 0.2.1

### Patch Changes

- [#20](https://github.com/lupinum-dev/nuxt-photo/pull/20) [`f9149eb`](https://github.com/lupinum-dev/nuxt-photo/commit/f9149eb6d4aae5f26ab27a1a2e533fead1d790f3) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify the package status in the npm README.

- Updated dependencies [[`f9149eb`](https://github.com/lupinum-dev/nuxt-photo/commit/f9149eb6d4aae5f26ab27a1a2e533fead1d790f3)]:
  - @lupinum/vue-photo@0.2.1

## 0.2.0

### Breaking

- Removed the old framework-free engine and compatibility surfaces.
- Aligned the module with required photo IDs, explicit `PhotoGroup`
  collections, readonly public models, and the new Vue customization contract.
- Set Nuxt 4.4.8 as the minimum supported and certified Nuxt release.
- Raised the Node.js 22 support floor to 22.18 and defined Node 24 as the
  maintainer runtime.

### Changed

- Validate unknown Nuxt module options at setup time with structured,
  namespaced errors.
- Keep Embla internal to the Vue package instead of exposing vendor types.

### Fixed

- Fixed the packed runtime export for `PhotoValidationError`.
- Expanded package consistency and packed-consumer coverage.
- Fixed package export condition ordering so TypeScript declarations resolve
  before JavaScript imports.

## 0.1.2

### Added

- Added MIT license metadata and packed-package verification.

### Changed

- Defined package root entrypoints as the supported public surface.
- Raised the Node.js support floor to match the Nuxt 4 toolchain.
- Kept the Nuxt module aligned with the Vue package's supported customization
  surface.

### Fixed

- Fixed public examples and package-consumer coverage for the Nuxt module.

## 0.0.1

- Initial public preview of the Nuxt Photo module and runtime integration.
