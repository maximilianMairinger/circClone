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
export function mergeKeysDeepButNotCyclic<Into extends object, From extends object>(into: Into, from: From): Into & From {
  for (const key of Object.keys(from)) {
    if (into[key] !== undefined && !into.hasOwnProperty(key)) continue // prototype poisoning protection

    if (from[key] instanceof Object) {
      if (into[key] instanceof Object) mergeKeysDeepButNotCyclic(into[key], from[key])
      else into[key] = cloneKeys(from[key])
    }
    else into[key] = from[key]
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
      if (into[key] !== undefined && !into.hasOwnProperty(key)) continue // prototype poisoning protection

      if (from[key] instanceof Object) {
        if (known.has(from[key])) into[key] = known.get(from[key])
        else if (into[key] instanceof Object) mergeKeysDeepRec(into[key], from[key])
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
