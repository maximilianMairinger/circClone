# Circ clone

Simple lib to safely (regarding [prototype poisoning](https://medium.com/intrinsic-blog/javascript-prototype-poisoning-vulnerabilities-in-the-wild-7bc15347c96)) clone circular (deep) objects. Exports three functions: `cloneKeys`, `mergeDeep` and `cloneKeysButKeepSym`, that do what they say and are not configurable. They are properly types and support tree-shaking. Each implementation is considerable simple (thus small). All functions that keep track of circular references, use `WeakMap` to do so.

## Installation

```shell
 $ npm i circ-clone
```

## Usage

### Clone keys

`cloneKeys<Ob extends Object>(ob: Ob): Ob`

```ts
import { cloneKeys } from "circ-clone"

const obj = { a: 1, b: { c: 3 } }
obj.b.d = obj

const cloned = cloneKeys(obj)
```

### Merge deep

`mergeDeep<Into extends object, From extends object>(from: From, into: Into): Into & From`

Merges the properties of `from` into `into` recursively with support for cyclic references. References from `from` to `into` (or any of its nested objects) are not supported, as the resulting behavior is not defined. Arrays are not treated specially (indexes are overwritten). The return value is `=== into` (thus not cloned), only sub-branches (nested objects) of from that are new to into are cloned.

```ts
import { mergeDeep } from "circ-clone"

const into = { a: 2, b: { c: 4, d: { doesntMatter: "whats in here", asItGets: "overriden" } } }
const from = { a: 1, b: { c: 3, d: "see one line below" } }
from.b.d = from


const merged = mergeDeep(into, from)
// merged = into = {
//   a: 1,
//   b: {
//     c: 3,
//     d: [Circular]
//   }
// }
```

> Importantly note, that the fields on `into.b.d` do not get copied over, as the reference to `from.b.d` is considered new. The reason for this decision is that it seems unintuitive for members of into to suddenly be written into a place of into. If you however need this behavior, please let me know by creating an issue.

### Merge deep but not cyclic

`mergeDeepButNotCyclic<Into extends object, From extends object>(from: From, into: Into): Into & From`

Merges the properties of `from` into `into` without considering cyclic references! This is faster than `mergeDeep`, but has the drawback that cyclic references in both `from` and `into` (exclusively if in both at the same place) terminate the function with an (stackoverflow) exception, similar to how `JSON.stringify` would. Also note that references from `from` to `into` (or any of its nested objects) are not supported, as the resulting behavior is not defined. The return value is `=== into` (thus not cloned), only sub-branches (nested objects) of from that are new to into are cloned.

```ts
import { mergeDeepButNotCyclic } from "circ-clone"

const into = { a: 2, b: { c: 4, e: 5 } }
const from = { a: 1, b: { c: 3 } }

const merged = mergeDeepButNotCyclic(into, from)
// merged = into = {
//   a: 1,
//   b: {
//     c: 3,
//     e: 5
//   }
// }
```

### Clone keys but keep symbols

`cloneKeysButKeepSym<Ob extends Object>(ob: Ob): Ob`

Similar to `cloneKeys` but keeps symbols uncloned!

```ts
import { cloneKeysButKeepSym } from "circ-clone"

const obj = { a: 1, b: { c: 3 } }
obj.b.d = obj
const sym = Symbol("foo")
obj[sym] = {  }


const cloned = cloneKeysButKeepSym(obj)
cloned[sym] === obj[sym] // true
```

## Contribute

All feedback is appreciated. Create a pull request or write an issue.
