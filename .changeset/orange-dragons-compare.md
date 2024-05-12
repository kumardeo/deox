---
"@deox/cors-worker": patch
---

fix: check for same origin instead of same host in `Worker` constructor.
fix: use `location.href` as base url instead of `location.host`.
