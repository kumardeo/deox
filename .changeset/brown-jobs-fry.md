---
"@deox/gumroad": patch
---

fix: fix code execution from string (`eval()`) when running on cloudflare workers by replacing `console-log-colors` with its fork `@deox/clc`
