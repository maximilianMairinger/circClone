import { iterate } from "iterare"
import sani, { OBJECT, matches, OR } from "sanitize-against"


export {polyfill} from "sanitize-against"


export const cloneKeysButKeepSym = (() => {
  let known: WeakMap<any, any>
  return function cloneKeysButKeepSym<Ob extends unknown>(ob: Ob): Ob {
    known = new WeakMap()
    return cloneKeysButKeepSymRec(ob)
  }
  function cloneKeysButKeepSymRec(ob: unknown) {
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
  return function cloneKeys<Ob extends unknown>(ob: Ob): Ob {
    known = new WeakMap()
    return cloneKeysRec(ob)
  }
  function cloneKeysRec(ob: unknown) {
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

export type ObWithVal<Val> = {[key in string]: Val | ObWithVal<Val>} | Val

// we could maybe collaps this implementation with the clone keys one by simply doing map = val => val as default. But Im not sure if will negatively impact performance
export const cloneKeysAndMapProps = (() => {
  let known: WeakMap<any, any>
  let valMapF: (val: unknown, keyChain: KeyChain) => unknown
  let keyMapF: (key: string, keyChainWithoutThisKey: KeyChain) => string
  let hasKeyMapF: boolean
  return function cloneKeys<Ob extends ObWithVal<Val>, Val, Ret>(ob: Ob, valMap: (val: Val, keyChain: KeyChain) => Ret, keyMap?: (key: string, keyChainWithoutThisKey: KeyChain) => string): ObWithVal<Ret> {
    known = new WeakMap()
    valMapF = valMap
    keyMapF = keyMap
    hasKeyMapF = keyMap !== undefined
    return cloneKeysRec(ob, [])
  }
  function cloneKeysRec(ob: any, keyChain: KeyChain) {
    if (typeof ob === "object" && ob !== null) {
      if (known.has(ob)) return known.get(ob)
      const cloned = new (ob instanceof Array ? Array : Object)
      known.set(ob, cloned)
      for (const srcKey of Object.keys(ob)) {
        const key = hasKeyMapF ? keyMapF(srcKey, keyChain) : srcKey
        
        if (cloned[key] === undefined) cloned[key] = cloneKeysRec(ob[srcKey], [...keyChain, key])
        // ^^^^^^^^^^^^^^^^^^^^^^^^^^^ > prototype poisoning protection 
        else if (hasKeyMapF) throw new Error("Key collision: " + key)
      }
      
      return cloned
    }
    else return valMapF(ob, keyChain)
  }
})()


const constrDefCircProtection = () => {
  const known = new Map()
  const f = (ob: object, fullPath: KeyChain) => {
    if (known.has(ob)) return false
    known.set(ob, fullPath)
    return true
  }
  f.rootPath = (ob: object) => known.get(ob)
  return f
}

const isPlainObjectOrArray = matches(sani(new OR(new OBJECT(), Array)))


// Deeply iterate over an object, calling a callback for each key/value pair.
export function iterateOverObject(ob: unknown, keepCircsInResult: true): Generator<{keyChain: string[], val: any, circ?: KeyChain}, void, unknown>
export function iterateOverObject(ob: unknown, keepCircsInResult?: false | undefined, circProtection?: ((ob: object, fullPath: KeyChain) => boolean) & {rootPath?(ob: object): KeyChain}): Generator<{keyChain: string[], val: any}, void, unknown>
export function iterateOverObject(ob: unknown, keepCircsInResult: true, circProtection?: ((ob: object, fullPath: KeyChain) => boolean)): Generator<{keyChain: string[], val: any, circ?: boolean}, void, unknown>
export function iterateOverObject(ob: unknown, keepCircsInResult: true, circProtection?: ((ob: object, fullPath: KeyChain) => boolean) & {rootPath?(ob: object): KeyChain}): Generator<{keyChain: string[], val: any, circ?: KeyChain}, void, unknown>
export function *iterateOverObject(ob: unknown, keepCircsInResult = false, circProtection: ((ob: object, fullPath: KeyChain) => boolean) & {rootPath?(ob: object): KeyChain} = constrDefCircProtection()) {
  let cur: {keyChain: KeyChain, val: any}[] = [{keyChain: [], val: ob}]
  if (typeof ob !== "object" || ob === null) {
    yield {keyChain: [], val: ob}
    return
  }
  if (!circProtection(ob, [])) return // this is important, so that circProtection can also keep track of the root ob
  const rootPathOrTrue = circProtection.rootPath !== undefined ? circProtection.rootPath.bind(circProtection) : () => true
  while(cur.length > 0) {
    const needDeeper = [] as {keyChain: KeyChain, val: any}[]
    for (const c of cur) {
      yield c
      const {keyChain, val} = c
      for (const key of Object.keys(val)) {
        const deeperKeyChain = [...keyChain, key]
        const v = val[key]
        if (isPlainObjectOrArray(v)) {
          if (circProtection(v, deeperKeyChain)) needDeeper.push({keyChain: deeperKeyChain, val: v})
          else if (keepCircsInResult) yield {keyChain: deeperKeyChain, val: v, circ: rootPathOrTrue(v)}
        }
        else yield {keyChain: deeperKeyChain, val: v}
      }
    }
    cur = needDeeper
  }
}


type KeyChain = string[]

export function findShortestPathToPrimitive(ob: unknown, matching: (a: unknown) => boolean) {
  return iterate(iterateOverObject(ob)).filter(({val}) => matching(val)).map(({keyChain}) => keyChain)
}


// warning: this omits circular references completely. Only the reference nearest to the root will be kept.
export function flatten(ob: unknown) {
  console.warn("flatten is deprecated. Use iterateOverObject instead. (its just wrapped into a iterare instance)")
  return iterate(iterateOverObject(ob))
}


export function uniqueMatch(f: (a: unknown) => boolean) {
  const known = new Set()
  return (a: unknown) => {
    if (known.has(a)) return false
    known.add(a)
    return f(a)
  }
}



// Helper type to safely access deep properties by their paths
type DeepKeyChainValue<T, P extends KeyChain> = P extends [infer First, ...infer Rest]
  ? First extends keyof T
    ? Rest extends KeyChain
      ? DeepKeyChainValue<T[First], Rest>
      : never
    : never
  : T;




export function pluck<T extends object, S, Path extends KeyChain>(ob: T, path: Path, setTo: ((val: DeepKeyChainValue<TemplateStringsArray, Path>) => S), computeSet: true): T
export function pluck<T extends object, S, Path extends KeyChain>(ob: T, path: Path, setTo?: S, computeSet?: false): T
export function pluck<T extends object, S, Path extends KeyChain>(ob: T, path: Path): DeepKeyChainValue<TemplateStringsArray, Path>
export function pluck(ob: any, path: KeyChain, setTo?: unknown | ((val: unknown) => unknown), computeSet?: boolean) {
  let cur = ob
  const setToIsUnset = setTo === undefined
  for (let i = 0; i < (path.length - (setToIsUnset ? 0 : 1)); i++) {
    const key = path[i]
    if (!Object.hasOwn(cur, key)) throw new Error("Path " + path.join(".") + " not found")
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^ prototype poisoning protection
    cur = cur[key]
  }
  if (setToIsUnset) return cur
  else {
    if (path.length === 0) return computeSet ? (setTo as Function)(ob) : setTo
    else {
      const pathFragment = path[path.length - 1]
      if (cur[pathFragment] === undefined || Object.hasOwn(cur, pathFragment)) cur[pathFragment] = computeSet ? (setTo as Function)(cur[pathFragment]) : setTo
      // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ prototype poisoning protection
      return ob
    }
  }
}


