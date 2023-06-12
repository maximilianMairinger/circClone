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

