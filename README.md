# Circ clone

Simple lib to savely clone circular (deep) objects. Exports three functions: `cloneKeys`, `mergeDeep` and `cloneKeysButKeepSym`, that do what they say, are not configurable and are tree shakeable. Each implementation is is considerable simple (thus small). All functions use WeakMap to keep track of circular references.

## Installation

```shell
 $ npm i circ-clone
```

## Usage

### Clone Keys

```ts
import { cloneKeys } from "circ-clone"

const obj = { a: 1, b: { c: 3 } }
obj.b.d = obj

const cloned = cloneKeys(obj)
```

### Merge Deep

```ts
import { mergeDeep } from "circ-clone"

const obj = { a: 1, b: { c: 3 } }
obj.b.d = obj

const merged = mergeDeep(obj, { a: 2, b: { c: 4, e: 5 } })
// merged = {
//   a: 2,
//   b: {
//     c: 4,
//     d: [Circular],
//     e: 5
//   }
// }
```

### Clone Keys But Keep Symbols

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
