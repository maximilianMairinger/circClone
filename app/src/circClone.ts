import { iterate } from "iterare"
export async function polyfill() {
  if (!(Object as any).hasOwn) {
    const { shim } = await import("object.hasown")
    shim()
  }
}


export const cloneKeysButKeepSym = (() => {
  let known: WeakMap<any, any>
  return function cloneKeysButKeepSym<Ob extends Object>(ob: Ob): Ob {
    known = new WeakMap()
    return cloneKeysButKeepSymRec(ob)
  }
  function cloneKeysButKeepSymRec(ob: any) {
    if (typeof ob === "object" && ob !== null) {
      if (known.has(ob)) return known.get(ob)
      const cloned = new (ob instanceof Array ? Array : Object)
      known.set(ob, cloned)
      
      for (const key of Object.keys(ob)) if (cloned[key] === undefined) cloned[key] = cloneKeysButKeepSymRec(ob[key])
      // prototype poisoning protection >^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 
      for (const sym of Object.getOwnPropertySymbols(ob)) cloned[sym] = ob[sym]
      return cloned
    }
    else return ob
  }
})()



// todo: change from and into 
export function mergeKeysDeepButNotCyclic<Into extends object, From extends object>(into: Into, from: From): Into & From {
  for (const key of Object.keys(from)) {
    const intoVal = into[key]
    const fromVal = from[key]
    if (intoVal !== undefined && !Object.hasOwn(into, key)) continue // prototype poisoning protection

    if (typeof from[key] === "object" && fromVal !== null) {
      if (typeof into[key] === "object" && intoVal !== null) mergeKeysDeepButNotCyclic(intoVal, fromVal)
      else into[key] = cloneKeys(from[key])
    }
    else into[key] = fromVal
  }
  return into as any
}


export const mergeKeysDeep = (() => {
  let known: WeakMap<any, any>
  return function mergeKeysDeep<Into extends object, From extends object>(into: Into, from: From): Into & From {
    known = new WeakMap()
    mergeKeysDeepRec(into, from)
    return into as any
  }
  function mergeKeysDeepRec(into: object, from: object) { 
    known.set(from, into)
    for (const key of Object.keys(from)) {
      const intoVal = into[key]
      const fromVal = from[key]
      if (intoVal !== undefined && !Object.hasOwn(into, key)) continue // prototype poisoning protection
      

      if (typeof from[key] === "object" && fromVal !== null) {
        if (known.has(from[key])) into[key] = known.get(from[key])
        else if (typeof into[key] === "object" && intoVal !== null) mergeKeysDeepRec(intoVal, fromVal)
        else into[key] = cloneKeys(from[key])
      }
      else into[key] = fromVal
    }
  }
})()


export const cloneKeys = (() => {
  let known: WeakMap<any, any>
  return function cloneKeys<Ob extends object>(ob: Ob): Ob {
    known = new WeakMap()
    return cloneKeysRec(ob)
  }
  function cloneKeysRec(ob: any) {
    if (typeof ob === "object" && ob !== null) {
      if (known.has(ob)) return known.get(ob)
      const cloned = new (ob instanceof Array ? Array : Object)
      known.set(ob, cloned)
      for (const key of Object.keys(ob)) if (cloned[key] === undefined) cloned[key] = cloneKeysRec(ob[key])
      // prototype poisoning protection >^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      return cloned
    }
    else return ob
  }
})()

export default cloneKeys


const defCircProtection = uniqueMatch(() => true)

// Deeply iterate over an object, calling a callback for each key/value pair.
export function *iterateOverObject(ob: object, keepCircsInResult = false, circProtection: (ob: object) => boolean = defCircProtection): Generator<{keyChain: KeyChain, val: any, circ?: boolean}> {
  if (!circProtection(ob)) return // this is important, so that circProtection can also keep track of the root ob
  let cur: {keyChain: KeyChain, val: any}[] = [{keyChain: [], val: ob}]
  while(cur.length > 0) {
    const needDeeper = [] as {keyChain: KeyChain, val: any}[]
    for (const c of cur) {
      yield c
      const {keyChain, val} = c
      for (const key in val) {
        if (typeof val[key] === "object" && val[key] !== null) {
          if (circProtection(val[key])) needDeeper.push({keyChain: [...keyChain, key], val: val[key]})
          else if (keepCircsInResult) yield {keyChain: [...keyChain, key], val: val[key], circ: true}
        }
        else yield {keyChain: [...keyChain, key], val: val[key]}
      }
    }
    cur = needDeeper
  }
}


type KeyChain = string[]

export function findShortestPathToPrimitive(ob: object, matching: (a: unknown) => boolean) {
  return flatten(ob).filter(({val}) => matching(val)).map(({keyChain}) => keyChain)
}


// warning: this omits circular references completely. Only the reference nearest to the root will be kept.
export function flatten(ob: object) {
  return iterate(iterateOverObject(ob)).filter(({val}) => typeof val !== "object" || val === null)
}


export function uniqueMatch(f: (a: unknown) => boolean) {
  const known = new Set()
  return (a: unknown) => {
    if (known.has(a)) return false
    known.add(a)
    return f(a)
  }
}
