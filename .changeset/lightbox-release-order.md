---
'@lupinum/vue-photo': patch
---

Fix the lightbox swipe on phones. When the finger lifts, the photo keeps moving instead of standing still for a few frames and then jumping. The counter and caption change about 100 ms later, while the photo settles. A close by fade shows the photo's thumbnail again as soon as it starts.
