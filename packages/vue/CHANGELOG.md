# @lupinum/vue-photo

## 1.0.0-beta.8

### Minor Changes

- [#116](https://github.com/lupinum-dev/nuxt-photo/pull/116) [`44642f6`](https://github.com/lupinum-dev/nuxt-photo/commit/44642f61f67a9bd45b4e64e325d27623257789a6) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add the `agent-docs` export: the documentation for the installed version, for coding agents.
  
  Follow **Agent setup** in the package README to point your project's `AGENTS.md` at it.

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

## 1.0.0-beta.5

### Patch Changes

- [#72](https://github.com/lupinum-dev/nuxt-photo/pull/72) [`29ede46`](https://github.com/lupinum-dev/nuxt-photo/commit/29ede4619a60090a51c3cf163244eb2a84c1180c) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Generate component declarations against the advertised minimum Vue types. Consumers on older supported Vue releases can type-check slots and components without requiring newer Vue generic parameters.

## 1.0.0-beta.4

### Patch Changes

- [#51](https://github.com/lupinum-dev/nuxt-photo/pull/51) [`1c049e8`](https://github.com/lupinum-dev/nuxt-photo/commit/1c049e8d3b611bf255de36c00b0df06586f46e15) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify beta installation, migration, and customization guidance for both published packages.

- [#53](https://github.com/lupinum-dev/nuxt-photo/pull/53) [`3ef5f1a`](https://github.com/lupinum-dev/nuxt-photo/commit/3ef5f1aabc00cc4c5f63cf8c867d44f143a8362c) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Reorganize and complete the public guides, concepts, and API reference for both packages.

- [#57](https://github.com/lupinum-dev/nuxt-photo/pull/57) [`d952f26`](https://github.com/lupinum-dev/nuxt-photo/commit/d952f268bf85a154556d9dd4c3729d7267f77239) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Turn the public examples into interactive showcases that demonstrate both packages in context.

- [#52](https://github.com/lupinum-dev/nuxt-photo/pull/52) [`d537187`](https://github.com/lupinum-dev/nuxt-photo/commit/d5371871d3d1ed545ae4c388af2538ef772cb989) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Simplify the installation, first-gallery, and architecture guidance for new users.

## 1.0.0-beta.3

### Patch Changes

- [#49](https://github.com/lupinum-dev/nuxt-photo/pull/49) [`ae1b5f3`](https://github.com/lupinum-dev/nuxt-photo/commit/ae1b5f3573b7e4301e97bd5dfc0d0668413d709e) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Keep shared lightbox navigation aligned when a collection opens at a non-zero photo, and allow carousel autoplay to be enabled without specifying a custom delay. Repair the documentation image demos so their rendered output matches the examples.

## 1.0.0-beta.2

### Patch Changes

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Honor Nuxt app-config-only photo defaults, preserve nested image settings, and localize carousel triggers. Harden collection registration, responsive placeholder resets, strict photo revalidation, metadata-safe layouts, and cancellation of overlapping lightbox animations.

## 1.0.0-beta.1

### Major Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Replace the prerelease Embla integration with stable Embla 8.6 and its documented public methods. `PhotoCarousel` now accepts direct `loop`, `dragFree`, and `direction` props. Remove the `options` bag, `slidesToScroll`, and the private snap-model integration. Carousel lightboxes remain opt-in.

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Finalize the 1.0 lightbox contract. Rename `useLightboxProvider()` to `provideLightbox()` and `LightboxDefaults` to `PhotoDefaults` without compatibility aliases. Export `LightboxHandle` and expose it only from `PhotoAlbum` and `PhotoGroup`. Transition props now rebuild from immutable defaults when changed or cleared, and live reduced-motion changes flow through animation timing.

### Minor Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Accessibility and direction: localized controls, native trigger buttons, RTL support, complete keyboard map

  **Every built-in label is centralized and localizable.** Missing values fall back to a frozen English label set, including polite slide announcements. Custom primitive compositions can read the complete active set with `usePhotoLabels()`.

  **PhotoTrigger renders a native `<button>`** instead of a `div` with `role="button"`. Focus, activation, and screen-reader semantics are now native. The element carries an `np-trigger` class with UA chrome reset, so slotted thumbnails style as before. Consumer CSS that styled the trigger via element selectors (`div`) must switch to class selectors.

  **Right-to-left layouts are supported.** All shipped CSS uses logical properties (`inset-inline`, `margin-inline-start`, `text-align: start`), so lightbox chrome, carousel arrows, counters, and captions mirror correctly under `dir="rtl"`.

  **Keyboard map completed**: `Home` and `End` jump to the first and last photo, joining `Escape`, arrow keys, and `z`. The full map is documented on the lightbox behavior page. The built-in counter region is now `aria-live="polite"` so slide changes are announced.

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add optional `placeholderSrc` previews to `PhotoItem` and `ImageSource`. Placeholders reset whenever the adapter-resolved URL changes and remain visible after load failures. `PhotoAlbum.sizes` now also accepts a native HTML sizes string for every layout.

### Patch Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Container-query rendering correctness

  Setting `defaultContainerWidth` together with `breakpoints` on `<PhotoAlbum>` no longer emits a dead `@container` stylesheet. Inline calc widths are authoritative when `defaultContainerWidth` is set; the container-query path now renders only when it can actually own the layout (breakpoints without `defaultContainerWidth`). Albums relying on the old dual emission need no change — the inline widths they rendered are unchanged.

  Container-query spans now use exact range syntax such as `width < 800px`. Integer, fractional, and subpixel breakpoints meet at the same exclusive boundary without subtractive offsets or uncovered gaps.

  An empty rows layout at every breakpoint now logs one dev-time warning instead of silently rendering unsized items.

## 0.2.1

### Patch Changes

- [#20](https://github.com/lupinum-dev/nuxt-photo/pull/20) [`f9149eb`](https://github.com/lupinum-dev/nuxt-photo/commit/f9149eb6d4aae5f26ab27a1a2e533fead1d790f3) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify the package status in the npm README.

## 0.2.0

### Breaking

- `LightboxRoot` now owns the FLIP transition visual. Custom lightboxes must
  remove `LightboxGhostImage` and `mediaOpacity` slot bindings.
- Replaced `--np-backdrop-blur` with `--np-backdrop-filter`.
- Photo IDs are required non-empty strings, and public photo and controller
  models are readonly.
- Removed `PhotoMapper`, `itemMapper`, `photoId`, object-identity opening,
  `openPhoto`, raw Embla options and plugins, and duplicate album layout props.
- `PhotoGroup` now requires one explicit `photos` collection.
- Carousel and autoplay props now use library-owned option types.
- Provider configuration is setup-time and requires a remount to change.
- Raised the Node.js 22 support floor to 22.18 and defined Node 24 as the
  maintainer runtime.

### Changed

- Replaced reactive ghost-image choreography with one WAAPI motion controller.
- Limited initial lightbox media mounting to active and adjacent slides.
- Centralized lifecycle intent, abortable transitions, modal and body-scroll
  ownership, gesture sessions, and pan and zoom orchestration.
- Derived carousel controls from Embla's geometry-dependent snap registry.
- Added structured validation at public photo boundaries.
- Ensured that only one lightbox owns focus and page isolation at a time.

### Removed

- Removed the framework-free engine package, compatibility paths, automatic
  `PhotoGroup` collection, public vendor types, private helper exports, and
  obsolete test scaffolding.

### Fixed

- Prevented responsive thumbnail-to-slide handoffs from briefly darkening.
- Fixed lifecycle interruption, stale intent, and cross-provider modal races.
- Fixed group registration ordering and carousel snap mismatches.
- Fixed rejected lifecycle promises in built-in interactions.
- Fixed package export condition ordering so TypeScript declarations resolve
  before JavaScript imports.

## 0.1.2

### Added

- Added the `useLightboxProvider`-first customization path for advanced
  lightbox interfaces.
- Added MIT license metadata and packed-package verification.

### Changed

- Moved advanced customization to the root Vue package entrypoint.
- Split photo-album rendering into dedicated rows, SSR snapshot, fallback, and
  mounted layout views.
- Defined package root entrypoints as the supported public surface.
- Raised the Node.js support floor to match the Nuxt 4 toolchain.
- Updated the Embla integration to the `9.0.0-rc02` release line.

### Removed

- Removed `@lupinum/vue-photo/extend`.
- Removed injected lightbox slot-override plumbing in favor of root exports and
  global lightbox component overrides.

### Fixed

- Fixed image decode failure handling and active-photo preservation.
- Fixed body-scroll ownership and missing `openById` behavior.
- Fixed invalid columns and masonry inputs.
- Added an accessible name to the built-in lightbox dialog.

## 0.0.1

- Initial public preview of the Vue photo components, composables, layouts,
  lightbox primitives, and styles.
