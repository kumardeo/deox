---
"@deox/gumroad": patch
---

refactor: Use classes for different endpoints.  
feat: Introduce a class `API` which has only API methods while `Gumroad` class extends `API` and has methods for handling webhooks.
build: set build target to ES2018
