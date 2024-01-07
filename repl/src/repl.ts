import { cloneKeys, cloneKeysButKeepSym, mergeKeysDeep, mergeKeysDeepButNotCyclic, findShortestPathToPrimitive, flatten, iterateOverObject, cloneKeysAndMapProps } from "../../app/src/circClone"
import deepMerge from "deepmerge"
import rfdc from 'rfdc'




const obj = () => {}
// @ts-ignore
// obj.a.b.c = obj.a
console.log(Array.from(iterateOverObject(obj)))


// const objA = { a: "a" }
// const objB = { b: "b" }
// objA.aNowB = objB

// // what if __proto is defined

// console.log(mergeDeep(objA, objB))


// const symC = Symbol("c")

// const ob = Object.create(null)
// ob.a = "a"
// ob["__proto__"] = { b: "Whaaa" }


// rfdc()(ob)
// cloneKeys(ob)
// cloneKeysButKeepSym(ob)

// const obB = Object.create(null)
// obB.b = "b"
// obB["__proto__"] = { c: "Whaaa2" }
// console.log(mergeKeysDeep(ob, obB))
// console.log(mergeKeysDeepButNotCyclic(ob, obB))



// console.log(ob.b)




// const objA = { a: "a" }
// const objB = { b: "b", c: { cc: "cc"} }

// const merged = deepMerge(objA, objB)

// console.log(merged)

