import { iterate } from "iterare"


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
export function mergeKeysDeepButNotCyclic<Into extends object, From extends object>(from: From, into: Into): Into & From {
  for (const key of Object.keys(from)) {
    const intoVal = into[key]
    const fromVal = from[key]
    if (intoVal !== undefined && !Object.hasOwn(into, key)) continue // prototype poisoning protection

    if (typeof fromVal === "object" && fromVal !== null) {
      if (typeof intoVal === "object" && intoVal !== null) mergeKeysDeepButNotCyclic(fromVal, intoVal)
      else into[key] = cloneKeys(fromVal)
    }
    else into[key] = fromVal
  }
  return into as any
}


// legacy
export const mergeDeepButNotRecursive = (...a) => {
  console.log('mergeDeepButNotRecursive is deprecated, use mergeKeysDeepButNotCyclic instead')
  return mergeKeysDeepButNotCyclic(...a as [any, any])
}
export const mergeDeepButNotCyclic = (...a) => {
  console.log('mergeDeepButNotCyclic is deprecated, use mergeKeysDeepButNotCyclic instead')
  return mergeKeysDeepButNotCyclic(...a as [any, any])
}

export const mergeKeysDeep = (() => {
  let known: WeakMap<any, any>
  return function mergeKeysDeep<Into extends object, From extends object>(from: From, into: Into): Into & From {
    known = new WeakMap()
    mergeKeysDeepRec(from, into)
    return into as any
  }
  function mergeKeysDeepRec(from: object, into: object) { 
    known.set(from, into)
    for (const key of Object.keys(from)) {
      const intoVal = into[key]
      const fromVal = from[key]
      if (intoVal !== undefined && !Object.hasOwn(into, key)) continue // prototype poisoning protection
      

      if (typeof fromVal === "object" && fromVal !== null) {
        if (known.has(fromVal)) into[key] = known.get(fromVal)
        else if (typeof intoVal === "object" && intoVal !== null) mergeKeysDeepRec(fromVal, intoVal)
        else into[key] = cloneKeys(fromVal)
      }
      else into[key] = fromVal
    }
  }
})()

// legacy
export const mergeDeep = (...a) => {
  console.log('mergeDeep is deprecated, use mergeKeysDeep instead')
  return mergeKeysDeep(...a as [any, any])
}



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
export function *iterateOverObject(ob: object, keepCircsInResult = false, circProtection: (ob: object) => boolean = defCircProtection, ) {
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
          else if (keepCircsInResult) yield {keyChain: [...keyChain, key], val: val[key]}
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
