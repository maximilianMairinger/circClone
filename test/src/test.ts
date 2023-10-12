import "./extend"
import { iterateOverObject, findShortestPathToPrimitive, flatten, cloneKeys } from "../../app/src/circClone"


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
    obj.a.b.c = obj
    
    const out = cloneKeys(obj)
    expect(iterateOverObject(obj, true)).eqArrInArbitraryOrder([
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
  