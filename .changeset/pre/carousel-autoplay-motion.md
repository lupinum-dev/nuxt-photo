---
'@lupinum/vue-photo': minor
'@lupinum/nuxt-photo': minor
---

Make carousel autoplay accessible. While autoplay runs, a pause and play button comes first in the carousel's tab order, and the slide counter stops announcing every automatic change to screen readers. Autoplay no longer runs while the reader prefers reduced motion, and starts when that preference is removed. Two new labels, `pauseAutoplay` and `playAutoplay`, translate the button.
