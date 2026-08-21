---
'@lupinum/vue-photo': patch
---

Solver tightening: local window bounds, allocation-free scoring, prefix-sum columns

The rows solver's search window is now computed per position from the actual aspect-ratio content instead of a global worst-case bound. One extreme panorama or tall-skinnie in an album no longer degrades the whole solve toward O(N²); windows stay proportional to the photos actually under consideration. Row candidates shorter than roughly a quarter of the target height were never optimal under quadratic badness and are no longer searched.

Row scoring allocates no intermediate arrays, path reconstruction walks indices instead of copying the photo list per row, and the columns solver reads candidate column heights from prefix sums instead of re-walking each range.

Layout outputs are unchanged for normal photo sets; a new randomized parity test pins generated container-query widths to solver geometry across seeded configurations.
