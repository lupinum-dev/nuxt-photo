---
'@lupinum/vue-photo': minor
---

Accessibility and direction: localized controls, native trigger buttons, RTL support, complete keyboard map

**Every built-in label is centralized and localizable.** Missing values fall back to a frozen English label set, including polite slide announcements.

**PhotoTrigger renders a native `<button>`** instead of a `div` with `role="button"`. Focus, activation, and screen-reader semantics are now native. The element carries an `np-trigger` class with UA chrome reset, so slotted thumbnails style as before. Consumer CSS that styled the trigger via element selectors (`div`) must switch to class selectors.

**Right-to-left layouts are supported.** All shipped CSS uses logical properties (`inset-inline`, `margin-inline-start`, `text-align: start`), so lightbox chrome, carousel arrows, counters, and captions mirror correctly under `dir="rtl"`.

**Keyboard map completed**: `Home` and `End` jump to the first and last photo, joining `Escape`, arrow keys, and `z`. The full map is documented on the lightbox behavior page. The built-in counter region is now `aria-live="polite"` so slide changes are announced.
