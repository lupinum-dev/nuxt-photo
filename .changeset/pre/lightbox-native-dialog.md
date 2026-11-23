---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Change the lightbox root to a native `<dialog>` opened with `showModal()`.

The browser now makes the page behind the lightbox inert and keeps focus inside it, so the library no longer sets `inert` and `aria-hidden` on page content or traps Tab itself. Escape and the Android back gesture still play the close animation, and a close the page cannot cancel ends in the closed state with scroll and history restored. The root keeps its accessible name, `ui` classes and passed attributes. A new `[data-np-lightbox-surface]` element inside the root holds the lightbox content and is the element the fullscreen tool enlarges, because browsers cannot show a `<dialog>` fullscreen. Safari users reach the lightbox controls with Option+Tab unless "Press Tab to highlight each item" is on, as on any Safari page.

Migration: change CSS that selects direct children of `[data-np-lightbox-root]` to select children of `[data-np-lightbox-surface]`. Remove `role="dialog"` and `aria-modal` from a custom root, and with `css: 'none'` reset the browser's dialog styles (border, padding, size limits, background and `::backdrop`).
