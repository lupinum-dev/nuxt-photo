---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Add lightbox deep links, optional download/share/fullscreen tools, and a tools slot. Mount only the active slide and three neighbors on each side, plus leaving slides.

Lightbox history is now enabled by default: opening adds a browser history entry, and Back closes the viewer without navigating the page. Set `lightbox.history: false` to opt out. Deep links opened on page load close by removing their query parameter without adding a history entry.
