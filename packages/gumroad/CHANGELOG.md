# @deox/gumroad

## 0.0.11

### Patch Changes

- [`427609a`](https://github.com/kumardeo/deox/commit/427609a52b34c73e99e2f34e5fe1232a8c2ced0f) Thanks [@kumardeo](https://github.com/kumardeo)! - add missing `variants` field in `Sale` type

## 0.0.10

### Patch Changes

- [`c43a1cb`](https://github.com/kumardeo/deox/commit/c43a1cb4db775cf18fcafd4be12637799a0b4073) Thanks [@kumardeo](https://github.com/kumardeo)! - fix types for `UpdateCancellation`

## 0.0.9

### Patch Changes

- [`1d906b3`](https://github.com/kumardeo/deox/commit/1d906b3cab1b4ef87917db15eeece896bde96f00) Thanks [@kumardeo](https://github.com/kumardeo)! - feat: allow passing `AbortSignal` through request option `signal` to set request's signal

- Updated dependencies [[`9af9a85`](https://github.com/kumardeo/deox/commit/9af9a8532fb53b4232ff5f757779a52cd02a2a8c), [`5cad31f`](https://github.com/kumardeo/deox/commit/5cad31fe07f41c856a315ecd6eab503f45a553b1)]:
  - @deox/utils@0.0.2

## 0.0.8

### Patch Changes

- [`9e517fd`](https://github.com/kumardeo/deox/commit/9e517fdd624da6abf648384868fcee7bdf024459) Thanks [@kumardeo](https://github.com/kumardeo)! - fix: fix code execution from string (`eval()`) when running on cloudflare workers by replacing `console-log-colors` with its fork `@deox/clc`

## 0.0.7

### Patch Changes

- [`67ee6fc`](https://github.com/kumardeo/deox/commit/67ee6fcb8170757a35b3c26d8c3bd2f29a36024a) Thanks [@kumardeo](https://github.com/kumardeo)! - refactor: codes

## 0.0.6

### Patch Changes

- [`8034991`](https://github.com/kumardeo/deox/commit/80349919722aef5c9dfffc30a603b0c7fe40f0e7) Thanks [@kumardeo](https://github.com/kumardeo)! - chore: use tsup

- Updated dependencies [[`8034991`](https://github.com/kumardeo/deox/commit/80349919722aef5c9dfffc30a603b0c7fe40f0e7)]:
  - @deox/check-types@0.0.3

## 0.0.5

### Patch Changes

- [`234104a`](https://github.com/kumardeo/deox/commit/234104a152c0eda42a574ce079fc816e716e30e1) Thanks [@kumardeo](https://github.com/kumardeo)! - refactor: Use classes for different endpoints.
  feat: Introduce a class `API` which has only API methods while `Gumroad` class extends `API` and has methods for handling webhooks.
  build: set build target to ES2018
- Updated dependencies [[`d697400`](https://github.com/kumardeo/deox/commit/d6974000a60343cb097d59f39e7fb35e4709d3b3)]:
  - @deox/check-types@0.0.2

## 0.0.4

### Patch Changes

- [`f0fb6fd`](https://github.com/kumardeo/deox/commit/f0fb6fd20e93f136e0c333807122fce5f17ae54b) Thanks [@kumardeo](https://github.com/kumardeo)! - fix: typo in README.md

## 0.0.3

### Patch Changes

- [`bf16068`](https://github.com/kumardeo/deox/commit/bf160682ae45a92dc7285685c84ce07c10a11cfa) Thanks [@kumardeo](https://github.com/kumardeo)! - feat: add methods for handling webhooks (resource subscriptions)

## 0.0.2

### Patch Changes

- [`34b6595`](https://github.com/kumardeo/deox/commit/34b6595444edcb170af317099324b68869562d26) Thanks [@kumardeo](https://github.com/kumardeo)! - chore: build esm and cjs modules
