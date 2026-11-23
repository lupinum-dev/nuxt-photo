# Decisions

- **D1 (2026-09-28): Adopt Lupinum OSS v2 and retain package behavior checks.**
  Three workflows replace classification, certification, reconciliation, custom
  provenance verification and deployment automation. Photo keeps one sequential
  complete CI job, including minimum-Node compatibility checks, because generated
  Nuxt types, packed consumers and browser builds depend on built packages. The
  one required status is `ci`.
- **D2 (2026-09-28): Keep one fixed two-package release.** Packed consumer tests
  cover exact sibling versions, framework peer floors, declarations, exports and
  package contents. Repeated byte-identical builds and release eligibility
  manifests are removed; they are not product behavior." The starter publishes
  Vue before Nuxt (dependency order, D11).
- **D3 (2026-09-28): Keep the existing toolchain and native dependency policy.**
  Vite+, Vue template ESLint, vue-tsc, Nuxt Module Builder and unbuild remain.
  pnpm and Renovate retain the 24-hour quarantine without package exemptions.
- **D5 (2026-09-28): Publish only the current approved main artifact.** Replaced
  by D11. The publish job failed when `main` had moved after approval; that
  cancelled the `1.0.0-beta.7` publish when an unrelated PR merged.
- **D4 (2026-09-28): Complete provider cutover before merging the standard port.**
  The main ruleset must require `ci` from GitHub Actions. Replace the old CodeQL
  workflow with default setup, retain secret scanning and push protection, and
  verify the `npm` environment requires a reviewer, allows only main and denies
  admin bypass. npm trusted publishing remains `release.yml` / `npm` for both
  packages; no workflow-identity migration is needed. Verify these controls in
  the provider before claiming release readiness. No provider setting is changed
  by this code. Vercel uses Git integration with `docs/` as Root Directory and
  source files outside it enabled. Remove unused deployment secrets after the
  provider migration is approved.
- **D6 (2026-10-03): Test the published tarballs and keep recovery safe.**
  Replaced by D11, which says what happened to each release step.
- **D7 (2026-10-06): Adopt Lupinum OSS v3.** Both packages ship the built docs
  pages as `./agent-docs`, and each package README has the Agent setup; the
  separate skill and its reference generator are removed. Checks the handbook
  lists as not worth adding are removed: the action-SHA verifier, the
  dependency-policy checker (pnpm enforces the quarantine itself), and the
  metadata, Vercel and docs-theme shape checks. `pnpm build` also builds the
  docs, because the packed packages contain them; `pnpm build:packages` builds
  only the packages. The 1.0 prereleases keep the name `beta`; prereleases after
  1.0 are named `next`. Both publish under the `next` dist-tag.
- **D8 (2026-10-06): Keep the packed consumer tests, the bundle-size budget and the docs contract checks (FILE-08: lean).**
  They are most of the 2,000 lines in `scripts/`. Packed tests install the real
  tarballs at the framework floors, the size budget guards what users download,
  and the docs checks keep examples and references true to the code.
- **D9 (2026-10-06): One maintainer, with the release summary as the check.**
  Matthias maintains Nuxt Photo alone with agents, with one GitHub account and
  the current app permissions. There is no second reviewer, so the pack job
  lists every change to the release workflows, `scripts/release.mjs` and
  `.changeset/config.json` since the release that npm has now. Read it before
  approving the npm deployment. The handbook's "A second maintainer" section says what to
  add when that changes.
- **D10 (2026-10-06): Shared repository layout.** The root keeps only
  `README.md`, `LICENSE`, `AGENTS.md`, the workspace manifests and configuration
  that tools read from the root. Community files and `renovate.json` live in
  `.github/`, `CLAUDE.md` in `.claude/`, maintainer notes in `internals/`. The
  Playwright config lives with its tests in `playground/`, the shared TypeScript
  base with the packages, and pnpm settings in `pnpm-workspace.yaml`. The
  root changelog index is gone: each package has its own changelog.
- **D11 (2026-10-06): Adopt Lupinum OSS 834961b; the release machinery is the starter's.**
  `release.yml` and `scripts/release.mjs` match the starter apart from action
  pins, because the handbook allows no exception for `release.yml` and nothing
  below needs one for `release.mjs`. The starter's guards replace D5: publish
  needs a green `ci` on the released commit and refuses a version below its
  dist-tag, but a later merge to `main` no longer cancels a release. CI blocks
  only advisories that reach users of the packages (`scripts/audit-deps.mjs` in
  `pnpm verify`), so the ignored dev-tool advisories are gone. Changesets never
  versions or tags private workspace packages. What happened to the old release
  steps:
  - Packed tests on the release tarballs: dropped. `pnpm verify` in `ci` runs
    them on the output of `pnpm build` of the same commit, and publish needs
    that green `ci`.
  - Vue before Nuxt: kept by the starter, which now publishes in dependency
    order. A partial publish is finished with "Re-run failed jobs".
  - Failing on a version on npm without provenance, re-offering a release with
    a missing tag, the partial-publish source check and the stricter own-range
    check of the version patch: dropped here, proposed for the starter.
- **D12 (2026-11-15): The lightbox moves its slides with its own pointer engine.**
  Embla stays for `PhotoCarousel` only. In the lightbox, pan, pinch, close drag
  and the fade-mode swipe already ran on its own pointer code; a second engine
  for `slide` mode had to be told when not to drag (zoomed, animating) and
  added 5.4 kB of Brotli to the viewer chunk. `lightbox/track.ts` moves the
  track with one transform write per pointer move and settles with the Web
  Animations API. The release thresholds copy Embla 8's measured behavior;
  `architecture.test.ts` keeps Embla out of `lightbox/`, `primitives/` and
  `components/Lightbox.vue`.
- **D13 (2026-11-12): Thumbnails are found by photo ID in the DOM.** Triggers
  render `data-np-photo-id` (also on the server), and the lightbox asks
  `thumbnailFor(id)` only when it needs the element: open capture, open and
  close rectangles, direction and focus return. Index-based ref maps
  (`setThumbRef`, `thumbElsMap` and six more) broke when a photo appeared twice
  or an element was replaced. Attribute comparison instead of `CSS.escape`
  selectors needs no escaping; lookups run a few times per open or close.
- **D14 (2026-11-12): Every recipe is a photo group of one.** `Photo`,
  `PhotoAlbum` and `PhotoCarousel` use the surrounding `PhotoGroup` or create
  one with `usePhotoGroup`, so there is one code path for grouped and
  standalone use. "No photo found" is thrown in 2 places instead of 10, and
  `packages/vue/src` lost 116 lines.
- **D15 (2026-11-12): Rows, columns and masonry render from CSS on the
  server.** Each layout returns one plan (CSS, per-item class and style, order,
  width shares). The plan is evaluated at each width of a breakpoint ladder,
  `[320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560]`, which the caller's
  breakpoints or `responsive()` keys replace from their smallest value up;
  function-valued options are called at each width. The server HTML is the
  final layout at every container width: no skeleton, no measurement, no
  layout shift on hydration. The measured width stays only for `sizes`, so a
  375 px phone does not fetch files sized for a 1,200 px estimate. Rows CSS for
  1,000 photos is 45 kB raw, 6 kB gzip.
- **D16 (2026-11-15): Masonry picks columns once per column count.** A fixed
  pixel gap changes the shortest-column pick between ladder widths, so each
  span listed every photo: 424 kB raw CSS for 1,000 photos at 3 columns. Now
  the picks of the first width of each run with the same column count apply to
  the whole run. Fixed column count: 208 B CSS plus about 42 B inline per photo.
  Responsive 2/3/4 columns for 1,000 photos: 141 kB raw, 33 kB gzip (one span
  per column count). A photo keeps its column while the container resizes
  within one column count.
- **D17 (2026-11-15): The viewer loads on intent.** The album, photo, carousel
  and group import no viewer code. One dynamic import loads it on the first
  pointer, touch or focus on a trigger, on an idle callback once a trigger is
  visible (not with `saveData`), and on any open request; a deep link renders
  it on the server. "Album, before interaction" fell from 43,491 B (everything
  eager on `main`) to 20,640 B Brotli in that slice. A group with the lightbox
  off never imports the chunk.
- **D18 (2026-11-15): All viewer loads share one promise.** Vite's preload
  helper waits for a chunk's CSS only in the first call of an `import()`. When
  the intent preload made that call and a click made the second, the viewer
  could mount before its CSS applied and open without the thumbnail flight
  (1 to 2 of 20 cold opens under load). One shared promise, reset on error,
  makes every caller wait for the CSS; a spec with a 1 s CSS delay fails 9 of 9
  without it.
- **D19 (2026-11-15): The lightbox CSS loads with the viewer.** In Nuxt the
  `css` mode picks a viewer host that carries the lightbox structure (and
  theme) CSS, so a page saves about 1.2 kB Brotli until someone opens a photo,
  and a server-rendered deep link inlines the CSS. Registered primitives keep
  the CSS global, because they build a lightbox outside the viewer chunk.
  Plain Vue imports `styles.css` or `lightbox.css` itself.
- **D20 (2026-11-15): The modal is a native `<dialog>`.** `showModal()` gives
  inertness, focus containment and Escape (`cancel`) from the browser; the
  hand-written inert bookkeeping, Tab trap, `role="dialog"` and `aria-modal`
  are gone (`LightboxRoot.vue` 175 → 114 lines, viewer chunk −294 B). Safari
  keeps its own Tab rule: with "Press Tab to highlight each item" off, Tab
  skips buttons and Option+Tab reaches them. Fullscreen targets an inner
  surface, because neither engine lets a dialog be the fullscreen element.
- **D21 (2026-11-15): `id` is optional and defaults to `src`.** Most photo
  lists have a unique `src`, and requiring an `id` added boilerplate. Two photos
  with the same resolved ID are a `duplicate-id` error that tells the user to
  give each an `id`. `ResolvedPhotoItem` types every photo handed back, so code
  that reads `photo.id` from slot props or handles still gets a string.
- **D22 (2026-11-15): The lightbox primitives have their own entry.** The root
  entry keeps the stable API (runtime names 22 → 13); `/primitives` is advanced
  API that may change in a minor version. `import *` of the root no longer
  pulls the viewer runtime into the eager chunk (35 kB instead of 49 kB Brotli).
- **D23 (2026-11-15): Motion finds its parts by attribute under the lightbox
  root.** Ten ref setters became one (`setSlideZoomRef`, kept because panzoom
  writes to that element every frame and the setter is its mount hook). Keys
  and engine shrank by 48 lines. Lookups are scoped to one root, so two
  lightboxes never see each other's parts; a custom primitive must not receive
  its own `data-np-motion` or `data-np-slide`.
- **D24 (2026-11-15): Nuxt chooses build-time variants through named entries
  and aliases.** The Vue package imports its label catalogs and viewer host by
  its own name (`/locales/photo`, `/locales/viewer`, `/viewer`); the Nuxt
  module points them at generated catalogs and the host of the `css` mode with
  `nuxt.options.alias`. This replaced a `resolveId` plugin that rewrote
  relative imports inside the Vue package and file paths into its `dist`.
  Components register by name from the entries: per-file exports measured
  0 B and 9 B smaller on the two deciding size scenarios, inside the 50 B tie
  band, so the smaller exports map won.
- **D25 (2026-11-15): `embla-carousel-vue` is removed.** The carousel creates
  its two Embla instances from `embla-carousel` and reinitializes them only
  when an option changes value, as the wrapper did. One dependency fewer (and
  its reactive utils); the full Vue import fell 184 B Brotli.
- **D26 (2026-11-15): `history` and `deepLink` stay in the library.**
  Visitors expect the back button to close a lightbox, `deepLink: true` is a
  one-line feature, and the code is about 160 lines. Moving it out would trade
  that for application code in every app.
- **D27 (2026-11-15): Function-valued layout options stay.** Since D15 they
  mean "called at each ladder width", which is clear and breaks nobody.
- **D28 (2026-11-15): Exact version pins and `h3` stay.** They follow the
  Lupinum OSS dependency policy; changing them is a release-time decision for
  the owner, not part of this redesign.
- **D29 (2026-11-15): Size limits are the measured size plus 5%.** Every
  scenario in `scripts/size/config.json` uses one rule: measured + 5%, rounded
  up to the next 10 B. Earlier limits mixed 2% to 10% margins; 5% catches a
  regression of one small module while leaving room for compression noise.
- **D30 (2026-11-15): Lightbox variable defaults have zero specificity.** The
  lightbox CSS loads with the viewer chunk, after the app's CSS, so its
  `.np-lightbox { --np-… }` defaults won every tie against the documented app
  override. They now sit in `:where(.np-lightbox)`; layout rules keep their
  class selectors. Class overrides in app CSS add `.np-lightbox` in front, as
  the styling guide shows. A cascade layer for all library CSS was the
  alternative; it would also change how Tailwind utilities and other layered
  CSS compete with it, so it is left for a release that can test that.
- **D31 (2026-11-16): One spring settles every drag, started at the release.**
  The swipe and the close drag settle with one critically damped spring
  (`SETTLE_STIFFNESS = 24` per second: half way in about 70 ms, 90% in about
  160 ms from rest, within 0.5 px after about a third of a second). It starts
  at the release speed, capped where it would pass rest, so it never bounces.
  It is sampled into one Web Animation with `easing: 'linear'`, which runs on
  the compositor in every browser and keeps `freeze()` and catching working;
  a main-thread frame loop was the alternative and would stutter under load.
  The animation's start time is the release's time stamp, so the first frame
  after the release already moves. A drag starts from the point where its
  direction locked, not from touch-down, so it does not jump by the slop;
  flick, snap, close and tap decisions still use the whole distance. 24 sits
  in the 18 to 26 range estimated for a firm, quick feel and meets the lab's
  proposed 100, 250 and 400 ms for travel up to a full photo; the owner's
  phone test can still move it.
- **D32 (2026-11-16): A swipe moves first and changes the photo later.** A
  pointer release toward a neighbour starts its settle in the release handler
  and changes the photo (counter, caption, active slide) 100 ms later, or at
  once on a catch, a new drag or the end of the settle. The change re-bases the
  running animation with `setKeyframes`, so the photo does not move. Before,
  the Vue render of the new photo ran before the first frame of the settle,
  and on a phone that frame came 2 to 3 frames late. A settle shows one frame
  of motion in its first drawn frame and is never backdated further: D31's
  start at the release's time stamp turned every late frame into a leap.
  `SETTLE_STIFFNESS` is 26 so the settle still reaches half way within
  100 ms. WebKit draws a Web Animation created in the release handler in the
  next frame, so the compositor animation stays; a frame loop was the
  fallback. Buttons, keys and the API keep changing the photo at once: their
  callers read the new index right away.
- **D33 (2026-11-16): A caption belongs to its slide and has no motion of its own.** The
  built-in lightbox rendered one caption layer placed from the
  active photo's `--np-frame-*` variables, with a 380 ms transition of `top`, `left` and
  `width` and a 90 + 220 ms text swap. Three clocks that nothing tied to the swipe spring:
  the old text stayed while its photo slid away, jumped toward the new photo, left a gap,
  then faded in. Each `LightboxSlide` now renders its photo's caption inside its frame
  (`#caption` slot), placed from that frame's own geometry, so the drag, the settle and the
  fade modes move it with no animation of its own. It sits inside the frame, not beside it,
  because the fade modes animate the frame. Consequences: a tap on a caption is ignored (taps
  are judged by geometry, and the caption is now inside the gesture area); a caption that
  mounts while the lightbox is open takes the controls' visibility (`adoptCaption`); the flip
  close hides only the photo under its ghost, not the viewport, so the caption fades with the
  controls; the flip open raises the slides' captions at the handoff. `LightboxCaption` stays
  for a caption in a fixed place. A unit test fails on any CSS transition or animation of a
  layout property in the lightbox styles. The close's backdrop fades linearly over the whole
  flight: with a 10% delay and a strong ease-out it lost 70% in four frames while the photo
  flew for a dozen more.
- **D34 (2026-11-16): A released settle sets its own start time.** A settle
  released by a pointer holds its first pose; in the next frame callback it
  sets `startTime` to `now - min(now - movedAt, one frame)`, where `movedAt` is
  when the drag last moved the photo. It stays one compositor Web Animation
  and this is one write in one frame callback, not a frame loop. Before, D32's
  settle was a pending animation held one frame in, and the browser fixed its
  start: WebKit sometimes fixed it before the frame from a timeline time that
  was not the frame's, and the first frame then showed up to two frames of
  motion (a 30.6 px leap in the lab). The time counts from the last move, not
  the release: the release does not move the photo, and in Chromium a release
  arrives after the frame's time stamp, so `now - release` would stand the
  first frame still. The close drag's settle uses the same rule.
- **D35 (2026-11-16): Opens and closes pass one start gate and fly on one spring.** Every
  open and close, flip and fade, first does its DOM and Vue work (ghost laid out, thumbnail
  hidden, stage mounted, slide photo hidden), lets one frame draw it, then creates all its
  animations held at time zero and starts them in one frame callback with that frame's time.
  So the first frame shows time zero in both engines, and no work of ours lands inside the
  fast part. Flights follow the settle's critically damped spring (`settleAt`) at stiffness
  18, sampled into linear keyframes; the ghost's pose and crop are interpolated by its
  progress, and the backdrop, shadow and controls follow the same progress. 18, not the
  settle's 26: a backdrop that follows progress may change at most 0.12 per frame, and the
  spring's fastest frame moves ω/e of the way. A drag-down close continues its release speed,
  projected on the flight and capped at 0.0045 of the way per ms. The ghost shows only after
  `decode()`, and the thumbnail hides a frame after the ghost showed. In `auto` mode a
  thumbnail partly off screen or under a fixed or sticky page element takes the fade; forced
  `flip` still flies. The check uses positions, not hit testing: the modal dialog makes the
  page inert, and inert elements are not hit-tested. The open costs no time; the close starts
  about one frame later, the frame that draws the work. Before, each motion was a set of
  pending animations on hand-made curves and delays, created with Vue work still to render,
  and a ghost was displayed before its image decoded: an iPhone recording showed blank ghost
  frames over the nav, a first frame a third of the way, and controls gone in one frame.
- **D36 (2026-11-16): The ambient glow follows the photo's motion.** The glow is a
  primitive a custom lightbox may leave out, so the lightbox does not own it: a mounted
  `LightboxAmbient` connects to a small channel on the context (`lightbox/glow.ts`), and
  the motion tells it what it shows. The slide track reports, on each pointer move, the
  photo it rests on, the neighbour it shows and the share of the way (one opacity write
  on one canvas); at a release it hands the glow its settle's samples as share keyframes,
  and the track starts both animations with one start rule (the start gate of D35 with the last
  move's time; without one for keys, buttons and the API). Catching a settle cancels both.
  The fade modes hand the glow the incoming photo's timing. Only a change without motion
  (set from outside, a jump with no settle) takes the timed linear crossfade of `duration`;
  reduced motion switches at once. Each glow is an opaque canvas per mounted photo, the
  photo the track rests on underneath at full opacity and the incoming one above it, so a
  crossfade never dips. The glows of the active photo and its neighbours are painted when
  the photo changes, from the page's own thumbnail when it is loaded and readable, else
  from a thumbnail request; the open waits at most one frame for the active one before its
  start gate. The glow sits in the backdrop, so opens and closes fade it with the backdrop
  and no fade of its own runs. Before, a new glow started when the active photo changed
  (100 ms after a release since D32), loaded its own image and faded in over 480 ms on
  its own clock: an iPhone recording showed the glow start about 180 ms after the swipe
  with a jump and end about 200 ms after the photo, and an open going dark before the glow.
- **D37 (2026-11-16): One start gate, typed ghost places, one photo-change state.** The
  consolidation pass after the owner accepted the feel kept the motion frame for frame and
  gave each idea one home. `createStartGate` (`transitions/animation.ts`) is the only way an
  animation's clock starts: it holds animations at time zero and starts them in a frame
  callback, from that frame's time or, after a drag, up to one frame back from the last move
  (D34). The motion state (`transitions/visual-state.ts`) remembers the ghost's layout box,
  pose and crop as numbers, and a running flight reports where it has the ghost; an
  interrupted open or close continues from that place. Before, the next motion parsed the
  CSS text of the transform and clip back (`readPose`, `readInset`). `coverPose` returns a
  pose and an inset. Every flight goes through `visual.fly`: the ghost's frame and crop plus
  rows for the backdrop, shadow and chrome on the same progress. The slide track holds a
  photo change as one tagged state (`idle`, `lead`, `asked`, `jump`) instead of six
  variables and two timers. The open's caption handoff lost its last hand-made curve: it is
  linear like every other part of the open.
- **D38 (2026-11-23): The Vue package ships compiled components.** `.vue` files in `dist`
  needed a bundler setting in every app: Nuxt's dev server loaded them with Node (500,
  "Unknown file extension .vue") unless the module added the package to `build.transpile`,
  and Vite's dev server pre-bundled the entries but loaded the `.vue` files and their imports
  beside the pre-bundle, so module state existed twice and `createPhoto` options never
  reached the components. `build.config.ts` keeps `mkdist` for declarations and stylesheets
  and replaces its JavaScript with a Vite library build (`preserveModules`, one file per
  source module). Self-references (`@lupinum/vue-photo/viewer`, `/locales/*`) stay bare
  imports, so Nuxt still aliases them and the viewer stays a lazy chunk. The Nuxt module
  generates the viewer host as an app component with `<style src>` blocks: a CSS import in a
  compiled package module loads on the client but is missing from the server HTML of a deep
  link, because Nuxt inlines and links server styles only for components it compiles. The
  Vue package's `/viewer-structure` and `/viewer-themed` hosts (never released) are gone.
  Sizes did not change. `scripts/lib/vite-dev-modules.mjs` fails a packed consumer whose dev server loads
  package files beside the pre-bundle.
