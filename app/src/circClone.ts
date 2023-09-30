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


type KeyChain = string[]

export const findShortestPathToPrimitive = (() => {
  let known: WeakSet<any>
  function findShortestPathToPrimitiveRec(ob: object, matching: (a: unknown) => boolean): KeyChain[] {
    known.add(ob)
    
    const found = [] as KeyChain[]
    
    let cur: ({keyChain: KeyChain, ob: object})[] = [{keyChain: [], ob}]
    while(cur.length > 0) {
      const needDeeper = [] as ({keyChain: KeyChain, ob: object})[]
      for (const {ob, keyChain} of cur) {
        for (const key in ob) {
          if (typeof ob[key] === "object" && ob[key] !== null && (Object.getPrototypeOf(ob[key]) === null || Object.getPrototypeOf(ob[key]) === Object.prototype)) {
            if (known.has(ob[key])) continue
            known.add(ob[key])
            needDeeper.push({keyChain: [...keyChain, key], ob: ob[key]})
          }
          else if (matching(ob[key])) found.push([...keyChain, key])
        }
      }
      cur = needDeeper
    }
    
    return found
  }

  return function findShortestPathToPrimitive(ob: any, matching: (a: unknown) => boolean) {
    known = new Set()
    const res = findShortestPathToPrimitiveRec(ob, matching)
    // @ts-ignore
    known = null
    return res
  }
})();

export function uniqueMatch(f: (a: unknown) => boolean) {
  const known = new Set()
  return (a: unknown) => {
    if (known.has(a)) return false
    known.add(a)
    return f(a)
  }
}
