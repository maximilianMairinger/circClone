import expectOrdered from "jest-expect-ordered"
import { stringify } from "circ-json"
import { circularDeepEqual } from "fast-equals"
import clone from "./../../app/src/circClone"
import { toOrdinal } from "number-to-words"
import { LinkedList } from "fast-linked-list"

declare global {
  namespace jest {
    interface Matchers<R, T> {
      eq(...got: any[]): CustomMatcherResult
      eqInArbitraryOrder(got: any | Iterable<any>): CustomMatcherResult
      eqArrInArbitraryOrder(got: any[] | Iterable<any>): CustomMatcherResult
      toBeIterable(): CustomMatcherResult
    }
  }
}


function eq(exp, ...got) {
  let pass = false
  for (const g of got) {
    if (circularDeepEqual(clone(exp), clone(g))) {
      pass = true
      break
    }
  }


  return {
    pass,
    message: () => `Expected ${this.utils.printReceived(clone(exp))} to be depply equal to ${got.map((got) => this.utils.printExpected(clone(got))).join(" or ")}`,
  }
}



const knownExp = new WeakMap()

expect.extend({
  ...expectOrdered,
  eq,
  inOrder(exp: any[], got) {
    if (!knownExp.has(exp)) {
      knownExp.set(exp, {arr: [...exp], counter: 0})
      expect.assertions(exp.length)
    }
    
    const { arr } = knownExp.get(exp)
    const empty = exp.length === 0
    const curVal = exp.shift()
    
    const counterIndex = knownExp.get(exp).counter
    knownExp.get(exp).counter++
    const counter = knownExp.get(exp).counter
    
    return {
      pass: !empty && circularDeepEqual(clone(curVal), clone(got)),
      message: () => `Expected checks in the following succession [${arr.map((e, i) => i < counterIndex ? this.utils.printExpected(e) : i === counterIndex ? this.utils.printReceived(got) : stringify(e)).join(", ")}].\nInstead of \n${this.utils.printReceived(got)}\n${this.utils.printExpected(curVal)}\nwas expected at the ${toOrdinal(counter)} invocation.`,
    }
  },
  eqInArbitraryOrder(exp: any[], got: any) {
    if (!knownExp.has(exp)) {
      knownExp.set(exp, {arr: new LinkedList(...exp)})
      expect.assertions(exp.length)
    }

    const { arr } = knownExp.get(exp)
    
    let pass = false
    arr.forEach((a, tok) => {
      if (pass) return
      if (eq(a, got).pass) {
        tok.rm()
        pass = true
      }
    })
    
    return {
      pass,
      message: () => `Cannot find ${this.utils.printReceived(got)} in ${this.utils.printExpected(exp)}`,
    }
  },
  eqArrInArbitraryOrder(_got: any[] | Iterable<any>, exp: any[]) {
    const got = _got instanceof Array ? _got : Array.from(_got)
    

    if (exp.length !== got.length) return {
      pass: false,
      message: () => `Expected ${this.utils.printReceived(got)} to have the same length as ${this.utils.printExpected(exp)}, got ${this.utils.printReceived(got.length)} instead of ${this.utils.printExpected(exp.length)}`,
    }



    const arr = new LinkedList(...got)
    for (const e of exp) {
      let pass = false
      arr.forEach((a, tok) => {
        if (pass) return
        if (eq(e, a).pass) {
          tok.rm()
          pass = true
        }
      })
      if (!pass) return {
        pass: false,
        message: () => `Cannot find ${this.utils.printReceived(e)} in ${this.utils.printExpected(got)}`,
      }
    }

    return {
      pass: true,
      message: () => `Expected ${this.utils.printReceived(got)} to be equal to ${this.utils.printExpected(exp)}`,
    }
  },
  toBeIterable(received) {
    const pass = typeof received[Symbol.iterator] === "function"
    return {
      pass,
      message: () => `Expected ${this.utils.printReceived(received)} to be iterable`,
    }
  }
  
})



