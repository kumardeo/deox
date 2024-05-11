---
"@deox/oson": patch
---

fix: use map insertion order as an index for labelling constructor to make sure we don't completely depend on constructor's name property. For example: Let's take a constructor with name `CustomClass`, previously it was labelled same as it's name property, i.e. `CustomClass`. Now, it will be labelled as `9:CustomClass` where `9` is the index of insertion order
feat: if an instance is not found in constructor map, it will try to find a class which is super class and use it if available
perf: improved typescript typings
