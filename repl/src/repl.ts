import { cloneKeys, cloneKeysButKeepSym, mergeDeep, mergeDeepButNotCyclic } from "../../app/src/circClone"
import deepMerge from "deepmerge"


// const objA = { a: "a" }
// const objB = { b: "b" }
// objA.aNowB = objB

// // what if __proto is defined

// console.log(mergeDeep(objA, objB))



const from = { a: 1, b: { c: 3 } }
from.b.d = from
const into = { a: 2, b: { c: 4, d: "gets overriden" } }
into.b.d = into

const out = mergeDeep(from, into)

console.log(out)




// const objA = { a: "a" }
// const objB = { b: "b", c: { cc: "cc"} }

// const merged = deepMerge(objA, objB)

// console.log(merged)

