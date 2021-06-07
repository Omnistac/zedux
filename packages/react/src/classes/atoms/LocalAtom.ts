import { localAtom } from '@zedux/react/factories'
import { AtomValueOrFactory, AtomConfig, LocalParams } from '@zedux/react/types'
import { generateLocalId } from '@zedux/react/utils'
import { StandardAtomBase } from './StandardAtomBase'

export class LocalAtom<
  State,
  Params extends any[],
  Exports extends Record<string, any>
> extends StandardAtomBase<State, LocalParams<Params>, Exports> {
  constructor(
    key: string,
    value: AtomValueOrFactory<State, LocalParams<Params>, Exports>,
    config?: AtomConfig
  ) {
    super(key, value, { ttl: 0, ...config })
  }

  public getKeyHash(params: LocalParams<Params>) {
    // If a string is passed as the first param, it's the id of the local atom.
    // An existing hash can be recreated.
    if (typeof params[0] === 'string') return super.getKeyHash(params)

    // Otherwise, every time a local atom is got, we create a new hash.
    return super.getKeyHash([generateLocalId(), ...params.slice(1)] as [
      string,
      ...Params
    ])
  }

  public override(
    newValue: AtomValueOrFactory<State, LocalParams<Params>, Exports>
  ) {
    return localAtom(this.key, newValue, {
      flags: this.flags,
    })
  }
}
