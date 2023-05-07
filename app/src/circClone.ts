export const cloneKeysButKeepSym = (() => {
  let known: WeakMap<any, any>
  return function cloneKeysButKeepSym<Ob extends Object>(ob: Ob): Ob {
    known = new WeakMap()
    return cloneKeysButKeepSymRec(ob)
  }
  function cloneKeysButKeepSymRec(ob: any) {
    if (ob instanceof Object) {
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
export function mergeDeepButNotCyclic<Into extends object, From extends object>(from: From, into: Into): Into & From {
  for (const key of Object.keys(from)) {
    if (into[key] !== undefined && !into.hasOwnProperty(key)) continue // prototype poisoning protection

    if (from[key] instanceof Object) {
      if (into[key] instanceof Object) mergeDeepButNotCyclic(from[key], into[key])
      else into[key] = cloneKeys(from[key])
    }
    else into[key] = from[key]
  }
  return into as any
}


// legacy
export const mergeDeepButNotRecursive = mergeDeepButNotCyclic

export const mergeDeep = (() => {
  let known: WeakMap<any, any>
  return function mergeDeep<Into extends object, From extends object>(from: From, into: Into): Into & From {
    known = new WeakMap()
    mergeDeepRec(from, into)
    return into as any
  }
  function mergeDeepRec(from: object, into: object) { 
    known.set(from, into)
    for (const key of Object.keys(from)) {
      if (into[key] !== undefined && !into.hasOwnProperty(key)) continue // prototype poisoning protection

      if (from[key] instanceof Object) {
        if (known.has(from[key])) into[key] = known.get(from[key])
        else if (into[key] instanceof Object) mergeDeepRec(from[key], into[key])
        else into[key] = cloneKeys(from[key])
      }
      else into[key] = from[key]
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
    if (ob instanceof Object) {
      if (known.has(ob)) return known.get(ob)
      const cloned = new ob.constructor()
      known.set(ob, cloned)
      for (const key of Object.keys(ob)) if (cloned[key] === undefined) cloned[key] = cloneKeysRec(ob[key])
      // prototype poisoning protection >^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      return cloned
    }
    else return ob
  }
})()


export default cloneKeys
