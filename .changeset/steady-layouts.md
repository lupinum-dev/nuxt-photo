---
'@lupinum/vue-photo': patch
'@lupinum/nuxt-photo': patch
---

Fix album layout shifts, slow large albums and several lightbox and carousel issues.

- Columns, masonry and rows render the same geometry on the server as in the browser, so nothing shifts while the page streams in or hydrates.
- Columns albums with thousands of photos lay out in milliseconds instead of freezing the page; large rows albums are faster too.
- Fast clicks on carousel arrows are no longer undone by a drag.
- The lightbox keeps focus inside when the browser skips buttons in its tab order, mirrors its arrows in right-to-left pages, and no longer triggers ResizeObserver loop errors.
- Photo validation errors keep their message and troubleshooting link in every component.
- Carousel autoplay no longer leaks event listeners when its options change.
