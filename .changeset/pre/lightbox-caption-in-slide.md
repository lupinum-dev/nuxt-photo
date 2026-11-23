---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change the lightbox caption to move with its photo. The built-in lightbox renders each photo's caption inside that photo's slide, under the photo, so the caption travels with it during a swipe and fades with it in `fade` and `crossfade`, with no animation of its own. Only the active photo's caption is exposed to assistive technology, and a tap on a caption no longer closes the lightbox. `LightboxSlide` takes the caption in a new `#caption` slot with `{ photo, index }` and a `captionClass` prop; `LightboxCaption` still renders one caption for the active photo. After a drag down, the backdrop now fades over the whole close instead of vanishing in a few frames.

Migration: rules that placed or animated `.np-lightbox__caption` through `--np-frame-*` no longer apply, and the `np-caption-enter-*` and `np-caption-leave-*` classes are gone. Set the place with `--np-caption-gap` and `--np-caption-width`, and select the active photo's caption with `[data-np-active] .np-lightbox__caption`. The `caption` slot of `Lightbox` now renders once per mounted slide, and its `photo` is never `null`.
