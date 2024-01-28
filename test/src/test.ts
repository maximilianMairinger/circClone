import "./extend"
import { iterateOverObject, findShortestPathToPrimitive, flatten, cloneKeys, uniqueMatch, mergeKeysDeep, mergeKeysDeepButNotCyclic } from "../../app/src/circClone"


describe("mergeKeysDeep", () => {
  test("multi ref: primitive set", () => {
    const bob = {
      lel: 2
    } as any

    const ob = {
      a: bob,
      b: bob,
      c: bob
    }

    expect(mergeKeysDeep(ob, {a: undefined})).eq({a: undefined, b: bob, c: bob})

    expect(mergeKeysDeep(ob, {a: undefined}).b).toBe(bob)
    expect(mergeKeysDeep(ob, {a: undefined}).c).toBe(bob)
  })

  test("multi ref: ref set", () => {
    const bob = {
      lel: 2
    } as any

    const ob = {
      a: bob,
      b: bob,
      c: bob
    }

    expect(mergeKeysDeep(ob, {a: {lel: 3}})).eq({a: {lel: 3}, b: {lel: 3}, c: {lel: 3}})

    expect(mergeKeysDeep(ob, {a: {lel: 4}}).b).toBe(bob)
    expect(bob.lel).toBe(4)
    expect(mergeKeysDeep(ob, {a: {lel: 5}}).c).toBe(bob)
    expect(bob.lel).toBe(5)
  })

  test("init primitive to", () => {
    expect(mergeKeysDeep(undefined, {a: 2, b: 3})).eq({a: 2, b: 3})
    expect(mergeKeysDeep(null, {a: 2, b: 3})).eq({a: 2, b: 3})
    expect(mergeKeysDeep("qwe", {a: 2, b: 3})).eq({a: 2, b: 3})
    expect(mergeKeysDeep(2, {a: 2, b: 3})).eq({a: 2, b: 3})


    const ob = {a: 2, b: 3}
    expect(mergeKeysDeep(undefined, ob)).toBe(ob)
  })

  test("init primitive from", () => {
    expect(mergeKeysDeep({a: 2, b: 3}, undefined)).eq(undefined)
    expect(mergeKeysDeep({a: 2, b: 3}, null)).eq(null)
    expect(mergeKeysDeep({a: 2, b: 3}, "qwe")).eq("qwe")
    expect(mergeKeysDeep({a: 2, b: 3}, 2)).eq(2)
  })

  test("prototype poisoning", () => {
    const obj = Object.create(null)
    obj.__proto__ = {a: 2}

    expect(mergeKeysDeep({}, obj).a).not.toBe(2)
  })
})

describe("mergeKeysButNotDeep", () => {
  test("multi ref: primitive set", () => {
    const bob = {
      lel: 2
    } as any

    const ob = {
      a: bob,
      b: bob,
      c: bob
    }

    expect(mergeKeysDeepButNotCyclic(ob, {a: undefined})).eq({a: undefined, b: bob, c: bob})

    expect(mergeKeysDeepButNotCyclic(ob, {a: undefined}).b).toBe(bob)
    expect(mergeKeysDeepButNotCyclic(ob, {a: undefined}).c).toBe(bob)
    const o = mergeKeysDeepButNotCyclic(ob, {a: undefined})
    expect(o.b).toBe(o.c)
  })

  test("multi ref: ref set", () => {
    const bob = {
      lel: 2
    } as any

    const ob = {
      a: bob,
      b: bob,
      c: bob
    }

    expect(mergeKeysDeepButNotCyclic(ob, {a: {lel: 3}})).eq({a: {lel: 3}, b: {lel: 3}, c: {lel: 3}})

    expect(mergeKeysDeepButNotCyclic(ob, {a: {lel: 3}}).a).toBe(bob)

    expect(mergeKeysDeepButNotCyclic(ob, {a: {lel: 4}}).b).toBe(bob)
    expect(bob.lel).toBe(4)
    expect(mergeKeysDeepButNotCyclic(ob, {a: {lel: 5}}).c).toBe(bob)
    expect(bob.lel).toBe(5)
  })

  test("init primitive to", () => {
    expect(mergeKeysDeepButNotCyclic(undefined, {a: 2, b: 3})).eq({a: 2, b: 3})
    expect(mergeKeysDeepButNotCyclic(null, {a: 2, b: 3})).eq({a: 2, b: 3})
    expect(mergeKeysDeepButNotCyclic("qwe", {a: 2, b: 3})).eq({a: 2, b: 3})
    expect(mergeKeysDeepButNotCyclic(2, {a: 2, b: 3})).eq({a: 2, b: 3})
    

    const ob = {a: 2, b: 3}
    expect(mergeKeysDeepButNotCyclic(undefined, ob)).toBe(ob)
  })

  test("init primitive from", () => {
    expect(mergeKeysDeepButNotCyclic({a: 2, b: 3}, undefined)).eq(undefined)
    expect(mergeKeysDeepButNotCyclic({a: 2, b: 3}, null)).eq(null)
    expect(mergeKeysDeepButNotCyclic({a: 2, b: 3}, "qwe")).eq("qwe")
    expect(mergeKeysDeepButNotCyclic({a: 2, b: 3}, 2)).eq(2)
  })

  test("prototype poisoning", () => {
    const obj = Object.create(null)
    obj.__proto__ = {a: 2}

    expect(mergeKeysDeepButNotCyclic({}, obj).a).not.toBe(2)
  })
})



describe("iterateOverObject", () => {
  test("Should return iterator", () => {
    expect(iterateOverObject({a: 2})).toBeIterable()
    expect(Array.from(iterateOverObject({a: 2}))).toBeInstanceOf(Array)
  })

  test("should iterate over all key/value pairs in a simple object", () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(iterateOverObject(obj)).eqArrInArbitraryOrder([
      { keyChain: [], val: obj },
      { keyChain: ["a"], val: 1 },
      { keyChain: ["b"], val: 2 },
      { keyChain: ["c"], val: 3 },
    ])
  })

  test("should iterate over all key/value pairs in a nested object", () => {
    const obj = { a: { b: { c: 1, d: 2 }, e: 3 } }


    expect(iterateOverObject(obj)).eqArrInArbitraryOrder([
      { keyChain: [], val: obj },
      { keyChain: ["a"], val: { b: { c: 1, d: 2 }, e: 3 } },
      { keyChain: ["a", "b"], val: { c: 1, d: 2 } },
      { keyChain: ["a", "b", "c"], val: 1 },
      { keyChain: ["a", "b", "d"], val: 2 },
      { keyChain: ["a", "e"], val: 3 },
    ])
  })

  
  test("should handle circular references", () => {
    const obj: any = { a: { b: {}, d: 2 } }
    obj.a.b.c = obj

    const out = cloneKeys(obj)
    expect(iterateOverObject(obj)).eqArrInArbitraryOrder([
      { keyChain: [], val: out },
      { keyChain: ["a"], val: out.a },
      { keyChain: ["a", "b"], val: out.a.b },
      { keyChain: ["a", "d"], val: out.a.d }
    ])
  })

  test("should handle circular references with keepCircsInResult=true", () => {
    const obj: any = { a: { b: {}, d: 2 } }
    obj.a.b.c = obj.a
    
    const out = cloneKeys(obj)
    expect(iterateOverObject(obj, true)).eqArrInArbitraryOrder([
      { keyChain: [], val: out },
      { keyChain: ["a"], val: out.a },
      { keyChain: ["a", "b"], val: out.a.b },
      { keyChain: ["a", "b", "c"], val: out.a.b.c, circ: ["a"] },
      { keyChain: ["a", "d"], val: out.a.d }
    ])
  })

  test("should handle circular references with keepCircsInResult=true and custom has func without rootPath", () => {
    const obj: any = { a: { b: {}, d: 2 } }
    obj.a.b.c = obj
    
    const out = cloneKeys(obj)

    expect(iterateOverObject(obj, true, uniqueMatch(() => true))).eqArrInArbitraryOrder([
      { keyChain: [], val: out },
      { keyChain: ["a"], val: out.a },
      { keyChain: ["a", "b"], val: out.a.b },
      { keyChain: ["a", "b", "c"], val: out.a.b.c, circ: true },
      { keyChain: ["a", "d"], val: out.a.d }
    ])
  })
})

describe("findShortestPathToPrimitive", () => {
  test("Should return iterator", () => {
    expect(findShortestPathToPrimitive({a: 2}, a => a===2)).toBeIterable()
    expect(Array.from(findShortestPathToPrimitive({a: 2}, a => a===2))).toBeInstanceOf(Array)
  })


  test("should find the shortest path to a primitive value", () => {
    const obj = { a: { b: { c: 1, d: "1", e: "2" } } }
    const result = findShortestPathToPrimitive(obj, (val) => val == 1)
    expect(result).eqArrInArbitraryOrder([
      ["a", "b", "c"],
      ["a", "b", "d"]
    ])
  })

  test("should find the shortest path to multiple primitive values", () => {
    const obj = { a: { b: { c: 1, d: "foo" } }, e: true }
    const result = findShortestPathToPrimitive(obj, (val) => typeof val === "string" || val === true)
    expect(result).eqArrInArbitraryOrder([
      ["a", "b", "d"], 
      ["e"]
    ])
  })

  test("should return an empty array if no primitive values match", () => {
    const obj = { a: { b: { c: { d: {} } } } }
    const result = findShortestPathToPrimitive(obj, (val) => typeof val === "string")
    expect(result).eqArrInArbitraryOrder([])
  })
})

describe("flatten", () => {
  test("Should return iterator", () => {
    expect(flatten({a: 2})).toBeIterable()
    expect(Array.from(flatten({a: 2}))).toBeInstanceOf(Array)
  })

  test("should flatten a simple object", () => {
    const obj = { a: 1, b: 2, c: 3 }
    const result = flatten(obj)
    expect(result).eqArrInArbitraryOrder([
      { keyChain: ["a"], val: 1 },
      { keyChain: ["b"], val: 2 },
      { keyChain: ["c"], val: 3 },
    ])
  })

  test("should flatten a nested object", () => {
    const obj = { a: { b: { c: 1 }, e: 2 } }
    const result = flatten(obj)
    expect(result).eqArrInArbitraryOrder([
      { keyChain: ["a", "b", "c"], val: 1 },
      { keyChain: ["a", "e"], val: 2 },
    ])
  })

  test("should handle circular references with no key", () => {
    const obj: any = { a: { b: {} } }
    obj.a.b.c = obj
    const result = flatten(obj)
    expect(result).eqArrInArbitraryOrder([])
  })

  test("should handle circular references", () => {
    const obj: any = { a: { b: { d: 2 } }, d: 3 }
    obj.a.b.c = obj
    const result = flatten(obj)
    expect(result).eqArrInArbitraryOrder([
      { keyChain: ["a", "b", "d"], val: 2 },
      { keyChain: ["d"], val: 3 },
    ])
  })
})
  