# @deox/oson

## 0.0.4

### Patch Changes

- [`8034991`](https://github.com/kumardeo/deox/commit/80349919722aef5c9dfffc30a603b0c7fe40f0e7) Thanks [@kumardeo](https://github.com/kumardeo)! - chore: use tsup

## 0.0.3

### Patch Changes

- [`48eacc3`](https://github.com/kumardeo/deox/commit/48eacc305cc10bcef5db7eb6d944ade8279a0e37) Thanks [@kumardeo](https://github.com/kumardeo)! - fix: use map insertion order as an index for labelling constructor to make sure we don't completely depend on constructor's name property. For example: Let's take a constructor with name `CustomClass`, previously it was labelled same as it's name property, i.e. `CustomClass`. Now, it will be labelled as `9:CustomClass` where `9` is the index of insertion order
  feat: if an instance is not found in constructor map, it will try to find a class which is super class and use it if available
  perf: improved typescript typings

## 0.0.2

### Patch Changes

- [`d697400`](https://github.com/kumardeo/deox/commit/d6974000a60343cb097d59f39e7fb35e4709d3b3) Thanks [@kumardeo](https://github.com/kumardeo)! - build: set build target to ES2018
