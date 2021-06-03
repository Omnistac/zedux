import { AtomValueOrFactory } from '../../types'
import { atom } from '@zedux/react/factories'
import { StandardAtomBase } from './StandardAtomBase'

export class Atom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends StandardAtomBase<State, Params, Exports> {
  public override(newValue: AtomValueOrFactory<State, Params, Exports>) {
    return atom(this.key, newValue, {
      flags: this.flags,
      maxInstances: this.maxInstances,
      ttl: this.ttl,
    })
  }
}
