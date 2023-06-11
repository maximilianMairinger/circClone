export const cloneKeysButKeepSym = (() => {
  let known: WeakMap<any, any>
  return function cloneKeysButKeepSym<Ob extends Object>(ob: Ob): Ob {
    known = new WeakMap()
    return cloneKeysButKeepSymRec(ob)
  }
  function cloneKeysButKeepSymRec(ob: any) {
    if (typeof ob === "object") {
      if (known.has(ob)) return known.get(ob)
      const cloned = new ob instanceof Array ? Array : Object
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
    if (into[key] !== undefined && !Object.hasOwn(into, key)) continue // prototype poisoning protection

    if (typeof from[key] === "object") {
      if (typeof into[key] === "object") mergeKeysDeepButNotCyclic(from[key], into[key])
      else into[key] = cloneKeys(from[key])
    }
    else into[key] = from[key]
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
      if (into[key] !== undefined && !Object.hasOwn(into, key)) continue // prototype poisoning protection

      if (typeof from[key] === "object") {
        if (known.has(from[key])) into[key] = known.get(from[key])
        else if (typeof into[key] === "object") mergeKeysDeepRec(from[key], into[key])
        else into[key] = cloneKeys(from[key])
      }
      else into[key] = from[key]
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
    if (typeof ob === "object") {
      if (known.has(ob)) return known.get(ob)
      const cloned = new ob instanceof Array ? Array : Object
      known.set(ob, cloned)
      for (const key of Object.keys(ob)) if (cloned[key] === undefined) cloned[key] = cloneKeysRec(ob[key])
      // prototype poisoning protection >^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      return cloned
    }
    else return ob
  }
})()

export default cloneKeys

