---
'@lupinum/vue-photo': patch
---

Say something when layout degrades instead of failing silently. The columns solver now emits a dev-time warning if partition reconstruction fails and it falls back to a single column. Shared gap and divisor arithmetic moved into one internal module so the JS layout and the generated container-query CSS cannot drift apart.
