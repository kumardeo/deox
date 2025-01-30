---
"@deox/utils": patch
---

fix(cookie): call `encodeURIComponent(key)` in `cookie.get()` method
fix(cookie): `cookie.getAll()` was ignoring keys with empty string as value
