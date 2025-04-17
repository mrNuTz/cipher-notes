import {EqOr} from './type'
import {filterItr, mapItr} from './misc'

export default class XSet<A> extends Set<A> {
  static fromItr<A>(iterable: Iterable<A>): XSet<A>
  static fromItr<A, B>(iterable: Iterable<A>, mapFn: (a: A) => B): XSet<B>
  static fromItr<A, B>(iterable: Iterable<A>, mapFn?: (a: A) => B) {
    return mapFn ? new XSet(mapItr(iterable, mapFn)) : new XSet(iterable)
  }

  addItr(iterable: Iterable<A>): this
  addItr<B>(iterable: Iterable<B>, mapFn: (b: B) => A): this
  addItr<B>(iterable: Iterable<A | B>, mapFn?: (b: B) => A) {
    for (const item of iterable) this.add(mapFn ? mapFn(item as B) : (item as A))
    return this
  }

  intersect<B>(that: Set<B>): XSet<A & B> {
    const res = new XSet<A & B>()
    for (const item of this.keys()) {
      if (that.has(item as any)) res.add(item as any)
    }
    return res
  }

  union<B>(that: Set<B>): XSet<A | B> {
    const res = new XSet<A | B>()
    for (const item of this.keys()) res.add(item)
    for (const item of that.keys()) res.add(item)
    return res
  }

  without<B>(that: Set<B>): XSet<EqOr<A, B, Exclude<A, B>>> {
    const res = new XSet<any>()
    for (const item of this.keys()) {
      if (!that.has(item as any)) res.add(item as any)
    }
    return res
  }

  isSubset(superSet: Set<A>): boolean {
    for (const item of this.keys()) {
      if (!superSet.has(item)) return false
    }
    return true
  }

  toArray() {
    return Array.from(this.keys())
  }

  toRecord(): Record<A extends string ? A : string, true> {
    const res = {} as any
    for (const item of this.keys()) res[String(item)] = true
    return res
  }

  map<B>(fn: (a: A) => B) {
    return XSet.fromItr(mapItr(this, fn))
  }

  filter(pred: (a: A) => boolean) {
    return XSet.fromItr(filterItr(this, pred))
  }
}
